const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors())

import { readFile } from 'fs';
const {getCurrentCost,getdataDayWeekMonth} = require('./dataMeter');
readFile('../../assets/data_power_meter.json', 'utf8', (err, datajson) => {
  if (err) {
    console.error('เกิดข้อผิดพลาดในการอ่านไฟล์', err);
    return;
  }

  const jsonData = JSON.parse(datajson);
  let data: any[] = jsonData;

  app.get('/getCurrentCost', (req: any, res: any) => {
    const sd = new Date(req.query.sd);
    const ed = new Date(req.query.ed);
    const metertype = req.query.metertype;
    const result = getCurrentCost(data, sd, ed, metertype);
    res.json(result);
  });

  app.get('/getdataDayWeekMonth', (req: any, res: any) => {
    const sd = req.query.sd ? new Date(req.query.sd) : new Date(0);
    const ed = req.query.ed ? new Date(req.query.ed) : new Date();
    const metertype = req.query.metertype;
    if (!sd || !ed || !metertype) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }
    let DataDayWeekMonth = {
      chartDay: [],
      chartWeek: [],
      chartMonth: [],
    };
    const result = getdataDayWeekMonth(data, sd, ed, metertype);
    res.json(result);
  });

  const PORT = process.env['PORT'] || 3001;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
