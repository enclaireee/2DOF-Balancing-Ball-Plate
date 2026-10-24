# Ball and Plate dashboard

A Next.js page that shows the data saved by `esp/datalog.py`. It reads `http://127.0.0.1:8000`, so start the logger first.

On Windows, in this folder:

```
npm install
npm run dev
```

Open http://localhost:3000.

Pages:

- Live (`/`): the plate with the ball, tilt, and X and Y position charts.
- Runs (`/runs`): saved runs, a position chart, the step response table and a CSV download.
- Setup (`/how-to-run`): the commands to run everything.
