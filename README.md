# EduPay School Management App

A lightweight single-page school management web app for handling:

- Student records
- Daily attendance
- Fee payment tracking
- Live dashboard summary

## Run locally

Because this is a static app, you can run it by opening `index.html` in a browser.

For a simple local server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Features

- Add and search students
- Mark daily attendance as present/absent/late
- Record fee payments by student
- Auto-calculate outstanding fee balance
- Persist data using browser `localStorage`
- Seed demo data with one click
