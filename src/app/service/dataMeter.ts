import { MeterNomal, MeterTypeTOU } from './classMeter';
import { DATA_HOLIDAY } from '../../assets/data_dayoff';
import { readFile } from 'fs';
const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors())
readFile('../../assets/data_power_meter.json', 'utf8', (err, datajson) => {
  if (err) {
    console.error('เกิดข้อผิดพลาดในการอ่านไฟล์', err);
    return;
  }

  const jsonData = JSON.parse(datajson);

  let sd = new Date('2023-12-29 00:00:00');
  let ed = new Date('2023-12-29 23:59:59');
  let data: any[] = jsonData;
  let metertype = 'over150';
  let hometype = 'Nomal';
  // let metertype = '12-24';
  // let hometype = 'TOU';
  interface datadayweekMonth {
    chartDay:
      | {
          date: string;
          unitTotal: number;
          priceTotal: number;
          onPeak: {
            unit: number;
            price: number;
          };
          offpeak: {
            unit: number;
            price: number;
          };
        }[];
    chartWeek:
      | {
          date: string;
          unitTotal: number;
          priceTotal: number;
          onPeak: {
            unit: number;
            price: number;
          };
          offpeak: {
            unit: number;
            price: number;
          };
        }[];
    chartMonth:
      | {
          date: string;
          unitTotal: number;
          priceTotal: number;
          onPeak: {
            unit: number;
            price: number;
          };
          offpeak: {
            unit: number;
            price: number;
          };
          fee: number;
          summary: number;
        }[];
  }
  let DataMonthTOU: {
    billNow: number;
    billOnPeak: number;
    billOffPeak: number;
    billSummary: number;
  }[] = [];
  let DataDayWeekMonth: datadayweekMonth = {
    chartDay: [],
    chartWeek: [],
    chartMonth: [],
  };
  let DataMonth: any[] = [];
  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  function getCurrentCost(
    data: any[],
    sd: Date,
    ed: Date,
    metertype: string,
    hometype: string
  ) {
    const monthlyData: {
      [month: string]: {
        unit: number;
        priceTotal: number;
        onpeakTotal: number;
        offpeakTotal: number;
        fee: number;
        summary: number;
      };
    } = {};

    const yearData: {
      [month: string]: {
        priceTotal: number;
      };
    } = {};
    let currDate: string = '';
    let energyNomal: number = 0;
    let energy: number = 0;
    let cuEnergy: number = 0;
    let totalUnit = 0;
    let engUnit = 0;
    let totalOnpeak = 0;
    let totalOffpeak = 0;
    let totalHoliday = 0;

    for (const item of data) {
      let curr = new Date(item.datetime);
      let time = curr.getTime();
      let month = curr.getMonth();
      let hour = curr.getHours();
      let minute = curr.getMinutes();

      if (sd.getTime() <= time && ed.getTime() >= time) {
        let monthKey = `${curr.getFullYear()}-${month + 1}`;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            unit: 0,
            priceTotal: 0,
            onpeakTotal: 0,
            offpeakTotal: 0,
            fee: 0,
            summary: 0,
          };
        }

        if (!currDate.length) {
          currDate = curr.toDateString();
        }

        energyNomal = Number(item.energy);
        console.log("energyNomal :",energyNomal)
        energy = Number(item.energy - cuEnergy);
        console.log("item.energy :",energyNomal,"- cuEnergy",cuEnergy,"=",energy)
      
        cuEnergy = Number(item.energy);
        console.log("cuEnergy :",cuEnergy)

        if (hometype == 'TOU') {
          let calc = new MeterTypeTOU({
            id: 0,
            type: metertype,
            name: 'AAA',
            date: item.datetime,
            energy: energy,
          });
          let unit = calc.Unit();
          let price = calc.PriceTotal();
          totalUnit += price;
          let fee = calc.Fee();
          // console.log('fee :', fee);
          let onPeak = calc.PriceOnPeak();
          totalOnpeak += onPeak;
          let offpeak = calc.PriceOffPeak();
          totalOffpeak += offpeak;
          let holiday = calc.PriceHoliday();
          totalHoliday += holiday;
          monthlyData[monthKey].unit += unit;
          monthlyData[monthKey].priceTotal += price;
          monthlyData[monthKey].onpeakTotal += onPeak;
          monthlyData[monthKey].offpeakTotal += offpeak + holiday;
          monthlyData[monthKey].fee = fee;
          monthlyData[monthKey].summary =
            monthlyData[monthKey].priceTotal + monthlyData[monthKey].fee;
        } else if (hometype == 'Nomal') {
          let calc = new MeterNomal({
            id: 0,
            type: metertype,
            name: 'AAA',
            date: item.datetime,
            energy: energy,
          });

          let unit = calc.Unit();
          engUnit += unit;
          let fee = calc.Fee();
          // console.log('engUnit :', engUnit);
          totalUnit = calc.ElectricityBillBelow(engUnit);
          monthlyData[monthKey].unit += unit;
          monthlyData[monthKey].priceTotal = calc.ElectricityBillBelow(
            monthlyData[monthKey].unit
          );
          monthlyData[monthKey].fee = fee;
          monthlyData[monthKey].summary =
            monthlyData[monthKey].priceTotal + monthlyData[monthKey].fee;
        }
      }
    }
    let summaryTotal = 0;
    let billNow = 0;
    for (const item in monthlyData) {
      summaryTotal += monthlyData[item].summary;
      billNow += monthlyData[item].priceTotal;
    }

    DataMonthTOU.push({
      billNow: billNow,
      billOnPeak: totalOnpeak,
      billOffPeak: totalOffpeak + totalHoliday,
      billSummary: summaryTotal,
    });
    // console.log('DataMonthTOU :', DataMonthTOU);

    return DataMonthTOU;
  }
  function getdataDayWeekMonth(
    data: any[],
    sd: Date,
    ed: Date,
    metertype: string,
    hometype: string
  ) {
    let currDate: string = '';
    let energyNomal: number = 0;
    let energy: number = 0;
    let cuEnergy: number = 0;
    let hourOn = 0;
    let hourOff = 0;
    let hourOnWeek = 0;
    let hourOffWeek = 0;
    let hourOnMonth = 0;
    let hourOffMonth = 0;
    let prevMonth = -1;
    let totalUnit = 0;
    let totalOnpeak = 0;
    let totalOffpeak = 0;
    let totalHoliday = 0;
    let dailyTotals: DailyTotals = {};
    let weeklyData: weeklyData = {};
    let monthlyData: monthlyData = {};

    interface DailyTotals {
      [key: string]: {
        date: string;
        unitTotal: number;
        priceTotal: number;
        onPeak: {
          unit: number;
          hour: number;
          price: number;
        };
        offpeak: {
          unit: number;
          hour: number;
          price: number;
        };
      };
    }
    interface weeklyData {
      [key: string]: {
        date: string;
        unitTotal: number;
        priceTotal: number;
        onPeak: {
          unit: number;
          hour: number;
          price: number;
        };
        offpeak: {
          unit: number;
          hour: number;
          price: number;
        };
      };
    }
    interface monthlyData {
      [key: string]: {
        date: string;
        unitTotal: number;
        priceTotal: number;
        onPeak: {
          unit: number;
          hour: number;
          price: number;
        };
        offpeak: {
          unit: number;
          hour: number;
          price: number;
        };
        fee: number;
        summary: number;
      };
    }
    let daysPassed: number = 0;
    for (const item of data) {
      let curr = new Date(item.datetime);
      let time = curr.getTime();
      let month = curr.getMonth();
      let day = curr.getDay();
      let hours = curr.getHours();
      let minute = curr.getMinutes();
      if (sd.getTime() <= time && ed.getTime() >= time) {
        let monthKey = `${curr.getFullYear()}-${month + 1}`;

        let weekStart = new Date(
          curr.getFullYear(),
          curr.getMonth(),
          curr.getDate() - curr.getDay()
        ); // วันเริ่มต้นของสัปดาห์
        let weekKey = `${weekStart.toDateString()}`;
        let dayKey = curr.toDateString();

        if (hours == 0 && minute == 0) {
          // รีเซ็ตตัวแปรเมื่อเปลี่ยนวัน
          hourOn = 0;
          hourOff = 0;
          daysPassed++;
        }
        if (daysPassed % 7 == 1) {
          if (hours == 0 && minute == 0) {
            hourOnWeek = 0;
            hourOffWeek = 0;
          }
        }
        if (month !== prevMonth) {
          // กำหนดค่าเริ่มต้นของชั่วโมงใหม่เป็น 0 เมื่อเลขเดือนเปลี่ยน
          hourOnMonth = 0;
          hourOffMonth = 0;
          prevMonth = month; // ปรับค่าเลขเดือนก่อนหน้าเป็นเลขเดือนปัจจุบัน
        }
        let has = DATA_HOLIDAY.some(
          (o) =>
            new Date(o).toDateString() == new Date(item.datetime).toDateString()
        );
        if (!has) {
          if (day == 0 || day == 6) {
            if (minute == 55) {
              hourOff++;
              hourOffMonth++;
              hourOffWeek++;
            }
          } else {
            if (hours >= 9 && hours < 22) {
              if (minute == 55) {
                hourOn++;
                hourOnMonth++;
                hourOnWeek++;
              }
            } else {
              if (minute == 55) {
                hourOff++;
                hourOffMonth++;
                hourOffWeek++;
              }
            }
          }
        } else {
          if (minute == 55) {
            hourOff++;
            hourOffMonth++;
            hourOffWeek++;
          }
        }

        if (!dailyTotals[dayKey]) {
          dailyTotals[dayKey] = {
            date: '',
            unitTotal: 0,
            priceTotal: 0,
            onPeak: {
              unit: 0,
              hour: 0,
              price: 0,
            },
            offpeak: {
              unit: 0,
              hour: 0,
              price: 0,
            },
          };
        }

        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = {
            date: '',
            unitTotal: 0,
            priceTotal: 0,
            onPeak: {
              unit: 0,
              hour: 0,
              price: 0,
            },
            offpeak: {
              unit: 0,
              hour: 0,
              price: 0,
            },
          };
        }

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            date: '',
            unitTotal: 0,
            priceTotal: 0,
            onPeak: {
              unit: 0,
              hour: 0,
              price: 0,
            },
            offpeak: {
              unit: 0,
              hour: 0,
              price: 0,
            },
            fee: 0,
            summary: 0,
          };
        }
        if (!currDate.length) {
          currDate = curr.toDateString();
        }
        energyNomal = Number(item.energy);
        energy = Number(item.energy - cuEnergy);
      
        cuEnergy = Number(item.energy);
        if (hometype == 'TOU') {
          let calc = new MeterTypeTOU({
            id: 0,
            type: metertype,
            name: 'AAA',
            date: item.datetime,
            energy: energy,
          });

          let unitTotal = calc.UnitTotal();
          let priceTotal = calc.PriceTotal();
          let unitOnpeak = calc.UnitOnPeak();
          let priceOnpeak = calc.PriceOnPeak();
          let unitOffpeak = calc.UnitOffPeack();
          let priceOffpeak = calc.PriceOffPeak();
          let unitHoliday = calc.UnitHoliday();
          let priceHoliday = calc.PriceHoliday();
          let fee = calc.Fee();

          let dateOnly = new Date(curr).toISOString().split('T')[0];
          dailyTotals[dayKey].date = dateOnly;
          dailyTotals[dayKey].unitTotal += unitTotal;
          dailyTotals[dayKey].priceTotal += priceTotal;
          dailyTotals[dayKey].onPeak.unit += unitOnpeak;
          dailyTotals[dayKey].onPeak.price += priceOnpeak;
          dailyTotals[dayKey].offpeak.unit += unitOffpeak + unitHoliday;
          dailyTotals[dayKey].offpeak.price += priceOffpeak + priceHoliday;
          dailyTotals[dayKey].onPeak.hour = hourOn;
          dailyTotals[dayKey].offpeak.hour = hourOff;

          weeklyData[weekKey].date = dateOnly;
          weeklyData[weekKey].unitTotal += unitTotal;
          weeklyData[weekKey].priceTotal += priceTotal;
          weeklyData[weekKey].onPeak.unit += unitOnpeak;
          weeklyData[weekKey].onPeak.price += priceOnpeak;
          weeklyData[weekKey].onPeak.hour = hourOnWeek;
          weeklyData[weekKey].offpeak.unit += unitOffpeak + unitHoliday;
          weeklyData[weekKey].offpeak.price += priceOffpeak + priceHoliday;
          weeklyData[weekKey].offpeak.hour = hourOffWeek;

          monthlyData[monthKey].date = dateOnly;
          monthlyData[monthKey].unitTotal += unitTotal;
          monthlyData[monthKey].priceTotal += priceTotal;
          monthlyData[monthKey].onPeak.unit += unitOnpeak;
          monthlyData[monthKey].onPeak.price += priceOnpeak;
          monthlyData[monthKey].onPeak.hour = hourOnMonth;
          monthlyData[monthKey].offpeak.unit += unitOffpeak + unitHoliday;
          monthlyData[monthKey].offpeak.price += priceOffpeak + priceHoliday;
          monthlyData[monthKey].offpeak.hour = hourOffMonth;
          monthlyData[monthKey].fee = fee;
          monthlyData[monthKey].summary =
            monthlyData[monthKey].priceTotal + monthlyData[monthKey].fee;
        } else if (hometype == 'Nomal') {
          let calc = new MeterNomal({
            id: 0,
            type: metertype,
            name: 'AAA',
            date: item.datetime,
            energy: energy,
          });

          let UnitTotal = calc.Unit();
          let fee = calc.Fee();
          let dateOnly = new Date(curr).toISOString().split('T')[0];

          dailyTotals[dayKey].date = dateOnly;
          dailyTotals[dayKey].unitTotal += UnitTotal;
          dailyTotals[dayKey].priceTotal = calc.ElectricityBillBelow(UnitTotal);
          weeklyData[weekKey].date = dateOnly;
          weeklyData[weekKey].unitTotal += UnitTotal;
          weeklyData[weekKey].priceTotal = calc.ElectricityBillBelow(
            weeklyData[weekKey].unitTotal
          );

          monthlyData[monthKey].date = dateOnly;
          monthlyData[monthKey].unitTotal += UnitTotal;
          monthlyData[monthKey].priceTotal = calc.ElectricityBillBelow(
            monthlyData[monthKey].unitTotal
          );
          
          let test = calc.ElectricityBillBelow(449.7526391459991);

          monthlyData[monthKey].fee = fee;
          monthlyData[monthKey].summary =
            monthlyData[monthKey].priceTotal + monthlyData[monthKey].fee;
        }
      }
    }
    for (let dayKey in dailyTotals) {
      let dailyTotal = dailyTotals[dayKey];
      DataDayWeekMonth.chartDay.push(dailyTotal);
    }
    for (let weekKey in weeklyData) {
      let weekTotal = weeklyData[weekKey];
      let weekUnit = DataDayWeekMonth.chartWeek.push(weekTotal);
    }
    for (let monthKey in monthlyData) {
      let monthTotal = monthlyData[monthKey];
      DataDayWeekMonth.chartMonth.push(monthTotal);
    }
    // console.log('monthlyData :', monthlyData);
    return DataDayWeekMonth;
  }
  function getdataMonth(
    data: any[],
    sd: Date,
    ed: Date,
    metertype: string,
    hometype: string
  ) {
    let currDate: string = '';
    let energy: number = 0;
    let cuEnergy: number = 0;
    let energyNomal: number = 0;
    const monthlyData: {
      [month: string]: {
        date: string;
        unitTotal: number;
        priceTotal: number;
        onPeak: {
          unit: number;
          price: number;
          hour: number;
        };
        offPeak: {
          unit: number;
          price: number;
          hour: number;
        };
        fee: number;
        summary: number;
      };
    } = {};
    let hourOn = 0;
    let hourOff = 0;
    let prevMonth = -1;
    for (let item of data) {
      let curr = new Date(item.datetime);
      let time = curr.getTime();
      let month = curr.getMonth();
      let day = curr.getDay();
      let hours = curr.getHours();
      let minute = curr.getMinutes();

      if (sd.getTime() <= time && ed.getTime() >= time) {
        let monthKey = `${curr.getFullYear()}-${curr.getMonth() + 1}`;

        if (!monthlyData[monthKey]) {
          // ถ้ายังไม่มีให้สร้างโครงสร้างใหม่
          monthlyData[monthKey] = {
            date: '',
            unitTotal: 0,
            priceTotal: 0,
            onPeak: {
              unit: 0,
              price: 0,
              hour: 0,
            },
            offPeak: {
              unit: 0,
              price: 0,
              hour: 0,
            },
            fee: 0,
            summary: 0,
          };
        }
        if (!currDate.length) {
          currDate = curr.toDateString();
        }

        energyNomal = Number(item.energy);

        energy = Number(item.energy - cuEnergy);
        cuEnergy = Number(item.energy);

        let calc = new MeterTypeTOU({
          id: 0,
          type: metertype,
          name: 'AAA',
          date: item.datetime,
          energy: energy,
        });
        let has = DATA_HOLIDAY.some(
          (o) =>
            new Date(o).toDateString() == new Date(item.date).toDateString()
        );
        if (month !== prevMonth) {
          hourOn = 0;
          hourOff = 0;
          prevMonth = month;
        }
        if (!has) {
          if (day == 0 || day == 6) {
            if (minute == 55) {
              hourOff++;
            }
          } else {
            if (hours >= 9 && hours < 22) {
              if (minute == 55) {
                hourOn++;
              }
            } else {
              if (minute == 55) {
                hourOff++;
              }
            }
          }
        } else {
          if (minute == 55) {
            hourOff++;
          }
        }
        if (hometype == 'TOU') {
          let calc = new MeterTypeTOU({
            id: 0,
            type: metertype,
            name: 'AAA',
            date: item.datetime,
            energy: energy,
          });
          let untiTotal = calc.Unit();
          let unitPrice = calc.PriceTotal();
          let onPeack = calc.PriceOnPeak();
          let OffPeack = calc.PriceOffPeak();
          let holiday = calc.PriceHoliday();
          let unitOnpeak = calc.UnitOnPeak();
          let unitOffpeak = calc.UnitOffPeack();
          let unitHoliday = calc.UnitHoliday();
          let fee = calc.Fee();

          monthlyData[monthKey].unitTotal += untiTotal;
          monthlyData[monthKey].priceTotal += unitPrice;
          monthlyData[monthKey].onPeak.unit += unitOnpeak;
          monthlyData[monthKey].onPeak.price += onPeack;
          monthlyData[monthKey].onPeak.hour = hourOn;
          monthlyData[monthKey].offPeak.unit += unitOffpeak + unitHoliday;
          monthlyData[monthKey].offPeak.price += OffPeack + holiday;
          monthlyData[monthKey].offPeak.hour = hourOff;
          monthlyData[monthKey].fee = fee;
          monthlyData[monthKey].summary =
            monthlyData[monthKey].priceTotal + monthlyData[monthKey].fee;
        } else if (hometype == 'Nomal') {
          let calc = new MeterNomal({
            id: 0,
            type: metertype,
            name: 'AAA',
            date: item.datetime,
            energy: energy,
          });
          let unitTotal = calc.Unit();
          let fee = calc.Fee();
          monthlyData[monthKey].unitTotal += unitTotal;
          let priceTotal = calc.ElectricityBillBelow(
            monthlyData[monthKey].unitTotal
          );
          let tset = calc.ElectricityBillBelow(449.7526391459991);
          console.log('tset :', tset);
          monthlyData[monthKey].priceTotal = priceTotal;
          monthlyData[monthKey].fee = fee;
          monthlyData[monthKey].summary =
            monthlyData[monthKey].priceTotal + monthlyData[monthKey].fee;
        }

        let dateOnly = new Date(curr).toISOString().split('T')[0];
        monthlyData[monthKey].date = dateOnly;
      }
    }
    for (let monthKey in monthlyData) {
      let dataMOnthTotal = monthlyData[monthKey];
      DataMonth.push(dataMOnthTotal);
    }
    return DataMonth;
    // console.log('monthlyData :', monthlyData);
  }
  // getCurrentCost(data, sd, ed, metertype, hometype);
  getdataDayWeekMonth(data, sd, ed, metertype, hometype);
  // getdataMonth(data, sd, ed, metertype, hometype);
  console.log('DataDayWeekMonth :', DataDayWeekMonth);
  app.get('/getCurrentCost', (req: any, res: any) => {
    let sd: Date;
    let ed: Date;
    const defaultStartDate = new Date('2023-01-01');
    const defaultEndDate = new Date('2023-12-30 23:59:59');
    const defaultHomeType = 'TOU';
    const defaultMeterTypeTOU = '12-24';
    const defaultMeterTypeNomal = 'below150';

    let metertype = req.query.metertype;
    let hometype = req.query.hometype;

    sd = req.query.sd ? new Date(req.query.sd) : defaultStartDate;
    ed = req.query.ed ? new Date(req.query.ed) : defaultEndDate;
    hometype = hometype || defaultHomeType;

    if (!metertype && hometype === 'TOU') {
      metertype = defaultMeterTypeTOU;
    } else if (!metertype && hometype === 'Nomal') {
      metertype = defaultMeterTypeNomal;
    }
    DataMonthTOU = [];
    const result = getCurrentCost(data, sd, ed, metertype, hometype);

    res.json(result);
  });

  app.get('/getdataDayWeekMonth', (req: any, res: any) => {
    let sd: Date;
    let ed: Date;
    const defaultStartDate = new Date('2023-01-01');
    const defaultEndDate = new Date('2023-12-30 23:59:59');
    const defaultHomeType = 'TOU';
    const defaultMeterTypeTOU = '12-24';
    const defaultMeterTypeNomal = 'below150';

    let metertype = req.query.metertype;
    let hometype = req.query.hometype;
    sd = req.query.sd ? new Date(req.query.sd) : defaultStartDate;
    ed = req.query.ed ? new Date(req.query.ed) : defaultEndDate;
    hometype = hometype || defaultHomeType;

    if (!metertype && hometype === 'TOU') {
      metertype = defaultMeterTypeTOU;
    } else if (!metertype && hometype === 'Nomal') {
      metertype = defaultMeterTypeNomal;
    }
    DataDayWeekMonth = {
      chartDay: [],
      chartWeek: [],
      chartMonth: [],
    };
    const result = getdataDayWeekMonth(data, sd, ed, metertype, hometype);
    res.json(result);
  });

  app.get('/getdataMonth', (req: any, res: any) => {
    let sd: Date;
    let ed: Date;
    const defaultStartDate = new Date('2023-01-01');
    const defaultEndDate = new Date('2023-12-30 23:59:59');
    const defaultHomeType = 'TOU';
    const defaultMeterTypeTOU = '12-24';
    const defaultMeterTypeNomal = 'below150';

    let metertype = req.query.metertype;
    let hometype = req.query.hometype;
    sd = req.query.sd ? new Date(req.query.sd) : defaultStartDate;
    ed = req.query.ed ? new Date(req.query.ed) : defaultEndDate;
    hometype = hometype || defaultHomeType;

    if (!metertype && hometype === 'TOU') {
      metertype = defaultMeterTypeTOU;
    } else if (!metertype && hometype === 'Nomal') {
      metertype = defaultMeterTypeNomal;
    }
    DataMonth = [];
    const result = getdataMonth(data, sd, ed, metertype, hometype);
    res.json(result);
  });

  const PORT = process.env['PORT'] || 3002;
  app.listen(PORT, () => {
    console.log('Server is running on port ${PORT}');
  });
});
