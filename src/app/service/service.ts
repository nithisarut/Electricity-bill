import {
  getCurrentCost,
  getdataDayWeekMonth,
  getdataMonth,
  getCustomerById,
  getCustomerAll,
} from './dataMeter';
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
const fs = require('fs');
const powerData = JSON.parse(
  fs.readFileSync('../../assets/data_power_meter.json')
);

let data: any[] = powerData;

app.get('/getCurrentCost', (req: any, res: any) => {
  try {
    let sd: Date;
    let ed: Date;
    const defaultStartDate = new Date('2023-01-01 00:00:00');
    const defaultEndDate = new Date('2023-12-30 23:59:59');
    const defaultHomeType = 'TOU';
    const defaultMeterTypeTOU = '12-24';
    const defaultMeterTypeNomal = 'below150';

    let metertype = req.query.metertype;
    let hometype = req.query.hometype;

    sd = req.query.sd ? (req.query.sd.includes(':') ? new Date(req.query.sd) : new Date(req.query.sd + ' 00:00:00')) : defaultStartDate;
    ed = req.query.ed ? (req.query.ed.includes(':') ? new Date(req.query.ed) : new Date(req.query.ed + ' 23:59:59')) : defaultEndDate
    hometype = hometype || defaultHomeType;

    if (!metertype && hometype === 'TOU') {
      metertype = defaultMeterTypeTOU;
    } else if (!metertype && hometype === 'Nomal') {
      metertype = defaultMeterTypeNomal;
    }
    const result = getCurrentCost(data, sd, ed, metertype, hometype);

    res.json(result);
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/getdataDayWeekMonth', (req: any, res: any) => {
  try {
    let sd: Date;
    let ed: Date;
    const defaultStartDate = new Date('2023-01-01 00:00:00');
    const defaultEndDate = new Date('2023-12-30 23:59:59');
    const defaultHomeType = 'TOU';
    const defaultMeterTypeTOU = '12-24';
    const defaultMeterTypeNomal = 'below150';

    let metertype = req.query.metertype;
    let hometype = req.query.hometype;
    sd = req.query.sd ? (req.query.sd.includes(':') ? new Date(req.query.sd) : new Date(req.query.sd + ' 00:00:00')) : defaultStartDate
    ed = req.query.ed ? (req.query.ed.includes(':') ? new Date(req.query.ed) : new Date(req.query.ed + ' 23:59:59')) : defaultEndDate
    hometype = hometype || defaultHomeType;

    if (!metertype && hometype === 'TOU') {
      metertype = defaultMeterTypeTOU;
    } else if (!metertype && hometype === 'Nomal') {
      metertype = defaultMeterTypeNomal;
    }

    const result = getdataDayWeekMonth(data, sd, ed, metertype, hometype);
    res.json(result);
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/getdataMonth', (req: any, res: any) => {
  try {
    let sd: Date;
    let ed: Date;
    const defaultStartDate = new Date('2023-01-01 00:00:00');
    const defaultEndDate = new Date('2023-12-30 23:59:59');
    const defaultHomeType = 'TOU';
    const defaultMeterTypeTOU = '12-24';
    const defaultMeterTypeNomal = 'below150';
        
    let metertype = req.query.metertype;
    let hometype = req.query.hometype;
    sd = req.query.sd ? (req.query.sd.includes(':') ? new Date(req.query.sd): new Date(req.query.sd + ' 00:00:00')) : defaultStartDate
    ed = req.query.ed ? (req.query.ed.includes(':') ? new Date(req.query.ed): new Date(req.query.ed + ' 23:59:59')) : defaultEndDate
    hometype = hometype || defaultHomeType;

    if (!metertype && hometype === 'TOU') {
      metertype = defaultMeterTypeTOU;
    } else if (!metertype && hometype === 'Nomal') {
      metertype = defaultMeterTypeNomal;
    }
    const result = getdataMonth(data, sd, ed, metertype, hometype);
    res.json(result);
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/getCustomerById', (req: any, res: any) => {
  try {
    let id: string;
    const defaultCustomer = '1';
    id = req.query.id ? req.query.id : defaultCustomer;
    const result = getCustomerById(id);
    if (result) {
      res.json(result);
    } else {
      res.status(500).json('Customer not found');
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/getCustomerAll', (req: any, res: any) => {
  try {
    const result = getCustomerAll();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

const PORT = process.env['PORT'] || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
