const STORAGE_KEY = "edupay-school-data-v1";

const elements = {
  studentForm: document.querySelector("#studentForm"),
  attendanceForm: document.querySelector("#attendanceForm"),
  paymentForm: document.querySelector("#paymentForm"),
  studentsTableBody: document.querySelector("#studentsTableBody"),
  studentRowTemplate: document.querySelector("#studentRowTemplate"),
  attendanceStudent: document.querySelector("#attendanceStudent"),
  paymentStudent: document.querySelector("#paymentStudent"),
  studentSearch: document.querySelector("#studentSearch"),
  studentCount: document.querySelector("#studentCount"),
  classCount: document.querySelector("#classCount"),
  presentToday: document.querySelector("#presentToday"),
  feesDue: document.querySelector("#feesDue"),
  seedDataBtn: document.querySelector("#seedDataBtn")
};

const today = () => new Date().toISOString().slice(0, 10);

const defaultData = {
  students: [],
  attendance: {},
  payments: {}
};

let state = load();

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return structuredClone(defaultData);
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      students: parsed.students || [],
      attendance: parsed.attendance || {},
      payments: parsed.payments || {}
    };
  } catch {
    return structuredClone(defaultData);
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function addStudent({ name, grade, guardian, monthlyFee }) {
  const id = crypto.randomUUID();
  state.students.push({
    id,
    name: name.trim(),
    grade: grade.trim(),
    guardian: guardian.trim(),
    monthlyFee: Number(monthlyFee)
  });
  save();
  render();
}

function markAttendance(studentId, status) {
  const date = today();
  state.attendance[date] ||= {};
  state.attendance[date][studentId] = status;
  save();
  render();
}

function recordPayment(studentId, amount) {
  state.payments[studentId] ||= [];
  state.payments[studentId].push({
    amount: Number(amount),
    date: today()
  });
  save();
  render();
}

function paymentsTotal(studentId) {
  return (state.payments[studentId] || []).reduce((sum, p) => sum + p.amount, 0);
}

function feeBalance(student) {
  const monthly = student.monthlyFee;
  const now = new Date();
  const monthsElapsed = now.getMonth() + 1;
  const expected = monthly * monthsElapsed;
  return Math.max(expected - paymentsTotal(student.id), 0);
}

function renderStudentSelectors() {
  const options =
    '<option value="" disabled selected>Select a student</option>' +
    state.students
      .map((student) => `<option value="${student.id}">${student.name} (${student.grade})</option>`)
      .join("");

  elements.attendanceStudent.innerHTML = options;
  elements.paymentStudent.innerHTML = options;
}

function attendanceBadge(status) {
  if (!status) {
    return '<span class="badge">Not Marked</span>';
  }
  return `<span class="badge ${status}">${status[0].toUpperCase()}${status.slice(1)}</span>`;
}

function renderStudents() {
  const filter = elements.studentSearch.value.trim().toLowerCase();
  const todayAttendance = state.attendance[today()] || {};

  const filtered = state.students.filter((student) => {
    if (!filter) {
      return true;
    }
    return (
      student.name.toLowerCase().includes(filter) ||
      student.grade.toLowerCase().includes(filter)
    );
  });

  elements.studentsTableBody.innerHTML = "";

  for (const student of filtered) {
    const row = elements.studentRowTemplate.content.cloneNode(true);
    const attendance = todayAttendance[student.id];
    const balance = feeBalance(student);

    row.querySelector('[data-cell="name"]').textContent = student.name;
    row.querySelector('[data-cell="grade"]').textContent = student.grade;
    row.querySelector('[data-cell="guardian"]').textContent = student.guardian;
    row.querySelector('[data-cell="attendance"]').innerHTML = attendanceBadge(attendance);

    const balanceCell = row.querySelector('[data-cell="balance"]');
    balanceCell.textContent = `$${balance.toFixed(2)}`;
    balanceCell.className = balance > 0 ? "balance-positive" : "balance-clear";

    elements.studentsTableBody.appendChild(row);
  }
}

function renderStats() {
  const todayAttendance = Object.values(state.attendance[today()] || {});
  const presentCount = todayAttendance.filter((status) => status === "present" || status === "late").length;

  const due = state.students.reduce((sum, student) => sum + feeBalance(student), 0);
  const uniqueClasses = new Set(state.students.map((s) => s.grade));

  elements.studentCount.textContent = String(state.students.length);
  elements.classCount.textContent = String(uniqueClasses.size);
  elements.presentToday.textContent = String(presentCount);
  elements.feesDue.textContent = `$${due.toFixed(2)}`;
}

function render() {
  renderStudentSelectors();
  renderStudents();
  renderStats();
}

function seedData() {
  if (state.students.length > 0) {
    return;
  }

  const samples = [
    { name: "Maya Johnson", grade: "Grade 8", guardian: "Samuel Johnson", monthlyFee: 125 },
    { name: "Liam Smith", grade: "Grade 7", guardian: "Emma Smith", monthlyFee: 110 },
    { name: "Ava Patel", grade: "Grade 8", guardian: "Ravi Patel", monthlyFee: 125 },
    { name: "Noah Brown", grade: "Grade 6", guardian: "Olivia Brown", monthlyFee: 105 }
  ];

  for (const student of samples) {
    addStudent(student);
  }

  const ids = state.students.map((s) => s.id);
  markAttendance(ids[0], "present");
  markAttendance(ids[1], "late");
  markAttendance(ids[2], "absent");

  recordPayment(ids[0], 200);
  recordPayment(ids[1], 120);
}

function wireEvents() {
  elements.studentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(elements.studentForm);

    addStudent({
      name: formData.get("name"),
      grade: formData.get("grade"),
      guardian: formData.get("guardian"),
      monthlyFee: formData.get("monthlyFee")
    });

    elements.studentForm.reset();
  });

  elements.attendanceForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(elements.attendanceForm);
    markAttendance(formData.get("studentId"), formData.get("status"));
    elements.attendanceForm.reset();
  });

  elements.paymentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(elements.paymentForm);
    recordPayment(formData.get("studentId"), formData.get("amount"));
    elements.paymentForm.reset();
  });

  elements.studentSearch.addEventListener("input", renderStudents);
  elements.seedDataBtn.addEventListener("click", seedData);
}

wireEvents();
render();
