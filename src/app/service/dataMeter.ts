import { MeterNomal, MeterTypeTOU } from './classMeter';
import { DATA_HOLIDAY } from '../../assets/data_dayoff';
const fs = require('fs');
const powerData = JSON.parse(
  fs.readFileSync('../../assets/data_power_meter.json')
);
const customerData = JSON.parse(
  fs.readFileSync('../../assets/data_customer.json')
);
let sd = new Date('2023-01-01 00:0:00');
let ed = new Date('2023-01-31 23:59:59');
let data: any[] = powerData;
let metertype = 'over150';
let hometype = 'Nomal';

interface Data {
  id: string;
  name: string;
  lastname: string;
  type_home: string;
  type_meter: string;
}
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
        offPeak: {
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
        offPeak: {
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
        offPeak: {
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
export function getCurrentCost(
  data: any[],
  sd: Date,
  ed: Date,
  metertype: string,
  hometype: string
) {
  DataMonthTOU = [];
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
  const monthlyData1: {
    [month: string]: {
      unit: number;
      priceTotal: number;
      onpeakTotal: number;
      offpeakTotal: number;
      fee: number;
      summary: number;
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

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const currentTime = new Date(item.datetime);
    let curr = new Date(item.datetime);
    let month = curr.getMonth();

    if (currentTime >= sd && currentTime <= ed) {
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
      if (i === 0) {
        energy = item.energy - 0;
      } else {
        const previousItem = data[i - 1];
        const previousEnergy = previousItem.energy;
        energy = Number(item.energy - previousEnergy);
      }
      cuEnergy = Number(item.energy);

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
  const yearlyPriceTotal: { [year: number]: number } = {};
  const yearlySummary: { [year: number]: number } = {};
  interface YearlySummary {
    [year: number]: number;
  }
  const yearlySummary2: YearlySummary = {};
  for (let i = 0; i < data.length; i++) {
    const currentItem = data[i];
    const currentTime = new Date(currentItem.datetime);
    let curr = new Date(data[i].datetime);
    let month = curr.getMonth();
    let monthKey1 = `${curr.getFullYear()}-${month + 1}`;

    const year = currentTime.getFullYear();

    energyNomal = Number(currentItem.energy);

    if (i === 0) {
      energy = currentItem.energy - 0;
    } else {
      const previousItem = data[i - 1];
      const previousEnergy = previousItem.energy;
      energy = Number(currentItem.energy - previousEnergy);
    }
    if (!monthlyData1[monthKey1]) {
      monthlyData1[monthKey1] = {
        unit: 0,
        priceTotal: 0,
        onpeakTotal: 0,
        offpeakTotal: 0,
        fee: 0,
        summary: 0,
      };
    }

    if (hometype == 'TOU') {
      let calc = new MeterTypeTOU({
        id: 0,
        type: metertype,
        name: 'AAA',
        date: data[i].datetime,
        energy: energy,
      });
      let price = calc.PriceTotal();

      if (!yearlyPriceTotal[year]) {
        yearlyPriceTotal[year] = 0;
      }
      yearlyPriceTotal[year] += price;
    } else if (hometype == 'Nomal') {
      let calc = new MeterNomal({
        id: 0,
        type: metertype,
        name: 'AAA',
        date: data[i].datetime,
        energy: energy,
      });

      let unit = calc.Unit();
      engUnit += unit;
      let fee = calc.Fee();
      totalUnit = calc.ElectricityBillBelow(engUnit);
      monthlyData1[monthKey1].unit += unit;
      monthlyData1[monthKey1].priceTotal = calc.ElectricityBillBelow(
        monthlyData1[monthKey1].unit
      );
      monthlyData1[monthKey1].fee = fee;
      monthlyData1[monthKey1].summary =
        monthlyData1[monthKey1].priceTotal + monthlyData1[monthKey1].fee;
    }

    cuEnergy = Number(currentItem.energy);
  }

  for (const year in yearlyPriceTotal) {
    yearlySummary[year] = yearlyPriceTotal[year];
  }
  let billSummary = 0;
  for (const item in monthlyData1) {
    billSummary += monthlyData1[item].priceTotal;
    if (monthlyData1.hasOwnProperty(item)) {
      const year: number = parseInt(item);
      if (!yearlySummary2[year]) {
        yearlySummary2[year] = 0;
      }
      yearlySummary2[year] += monthlyData1[item].priceTotal;
    }
  }
  DataMonthTOU.push({
    billNow: parseFloat(billNow.toFixed(2)),
    billOnPeak: parseFloat(totalOnpeak.toFixed(2)),
    billOffPeak: parseFloat((totalOffpeak + totalHoliday).toFixed(2)),
    billSummary:
      hometype == 'TOU'
        ? parseFloat(yearlySummary[ed.getFullYear()].toFixed(2))
        : parseFloat(yearlySummary2[ed.getFullYear()].toFixed(2)),
  });
  return DataMonthTOU;
}
export function getdataDayWeekMonth(
  data: any[],
  sd: Date,
  ed: Date,
  metertype: string,
  hometype: string
) {
  DataDayWeekMonth = {
    chartDay: [],
    chartWeek: [],
    chartMonth: [],
  };
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
      offPeak: {
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
      offPeak: {
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
      offPeak: {
        unit: number;
        hour: number;
        price: number;
      };
      fee: number;
      summary: number;
    };
  }
  let daysPassed: number = 0;
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const currentTime = new Date(item.datetime);
    let curr = new Date(item.datetime);
    let month = curr.getMonth();
    let day = curr.getDay();
    let hours = curr.getHours();
    let minute = curr.getMinutes();
    if (currentTime >= sd && currentTime <= ed) {
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
          offPeak: {
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
          offPeak: {
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
          offPeak: {
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
      if (i === 0) {
        // หากเป็นข้อมูลแรกให้ลบกับ 0
        energy = item.energy - 0;
      } else {
        const previousItem = data[i - 1];
        const previousEnergy = previousItem.energy;
        energy = Number(item.energy - previousEnergy);
      }

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
        dailyTotals[dayKey].offPeak.unit += unitOffpeak + unitHoliday;
        dailyTotals[dayKey].offPeak.price += priceOffpeak + priceHoliday;
        dailyTotals[dayKey].onPeak.hour = hourOn;
        dailyTotals[dayKey].offPeak.hour = hourOff;

        weeklyData[weekKey].date = dateOnly;
        weeklyData[weekKey].unitTotal += unitTotal;
        weeklyData[weekKey].priceTotal += priceTotal;
        weeklyData[weekKey].onPeak.unit += unitOnpeak;
        weeklyData[weekKey].onPeak.price += priceOnpeak;
        weeklyData[weekKey].onPeak.hour = hourOnWeek;
        weeklyData[weekKey].offPeak.unit += unitOffpeak + unitHoliday;
        weeklyData[weekKey].offPeak.price += priceOffpeak + priceHoliday;
        weeklyData[weekKey].offPeak.hour = hourOffWeek;

        monthlyData[monthKey].date = dateOnly;
        monthlyData[monthKey].unitTotal += unitTotal;
        monthlyData[monthKey].priceTotal += priceTotal;
        monthlyData[monthKey].onPeak.unit += unitOnpeak;
        monthlyData[monthKey].onPeak.price += priceOnpeak;
        monthlyData[monthKey].onPeak.hour = hourOnMonth;
        monthlyData[monthKey].offPeak.unit += unitOffpeak + unitHoliday;
        monthlyData[monthKey].offPeak.price += priceOffpeak + priceHoliday;
        monthlyData[monthKey].offPeak.hour = hourOffMonth;
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
        dailyTotals[dayKey].priceTotal = calc.ElectricityBillBelow(
          dailyTotals[dayKey].unitTotal
        );

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
        monthlyData[monthKey].fee = fee;
        monthlyData[monthKey].summary =
          monthlyData[monthKey].priceTotal + monthlyData[monthKey].fee;
      }
    }
  }
  for (let dayKey in dailyTotals) {
    let dailyTotal = dailyTotals[dayKey];
    let newdailyTotal = {
      date: dailyTotal.date,
      unitTotal: parseFloat(dailyTotal.unitTotal.toFixed(2)),
      priceTotal: parseFloat(dailyTotal.priceTotal.toFixed(2)),
      onPeak: {
        unit: parseFloat(dailyTotal.onPeak.unit.toFixed(2)),
        hour: dailyTotal.onPeak.hour,
        price: parseFloat(dailyTotal.onPeak.price.toFixed(2)),
      },
      offPeak: {
        unit: parseFloat(dailyTotal.offPeak.unit.toFixed(2)),
        hour: dailyTotal.offPeak.hour,
        price: parseFloat(dailyTotal.offPeak.price.toFixed(2)),
      },
    };
    DataDayWeekMonth.chartDay.push(newdailyTotal);
  }
  for (let weekKey in weeklyData) {
    let weekTotal = weeklyData[weekKey];
    let newweekTotal = {
      date: weekTotal.date,
      unitTotal: parseFloat(weekTotal.unitTotal.toFixed(2)),
      priceTotal: parseFloat(weekTotal.priceTotal.toFixed(2)),
      onPeak: {
        unit: parseFloat(weekTotal.onPeak.unit.toFixed(2)),
        hour: weekTotal.onPeak.hour,
        price: parseFloat(weekTotal.onPeak.price.toFixed(2)),
      },
      offPeak: {
        unit: parseFloat(weekTotal.offPeak.unit.toFixed(2)),
        hour: weekTotal.offPeak.hour,
        price: parseFloat(weekTotal.offPeak.price.toFixed(2)),
      },
    };
    DataDayWeekMonth.chartWeek.push(newweekTotal);
  }
  for (let monthKey in monthlyData) {
    let monthTotal = monthlyData[monthKey];
    let newmonthTotal = {
      date: monthTotal.date,
      unitTotal: parseFloat(monthTotal.unitTotal.toFixed(2)),
      priceTotal: parseFloat(monthTotal.priceTotal.toFixed(2)),
      onPeak: {
        unit: parseFloat(monthTotal.onPeak.unit.toFixed(2)),
        hour: monthTotal.onPeak.hour,
        price: parseFloat(monthTotal.onPeak.price.toFixed(2)),
      },
      offPeak: {
        unit: parseFloat(monthTotal.offPeak.unit.toFixed(2)),
        hour: monthTotal.offPeak.hour,
        price: parseFloat(monthTotal.offPeak.price.toFixed(2)),
      },
      fee: monthTotal.fee,
      summary: parseFloat(monthTotal.summary.toFixed(2)),
    };
    DataDayWeekMonth.chartMonth.push(newmonthTotal);
  }
  return DataDayWeekMonth;
}
export function getdataMonth(
  data: any[],
  sd: Date,
  ed: Date,
  metertype: string,
  hometype: string
) {
  DataMonth = [];
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
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const currentTime = new Date(item.datetime);
    let curr = new Date(item.datetime);
    let month = curr.getMonth();
    let day = curr.getDay();
    let hours = curr.getHours();
    let minute = curr.getMinutes();

    if (currentTime >= sd && currentTime <= ed) {
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

      if (i === 0) {
        // หากเป็นข้อมูลแรกให้ลบกับ 0
        energy = item.energy - 0;
      } else {
        const previousItem = data[i - 1];
        const previousEnergy = previousItem.energy;
        energy = Number(item.energy - previousEnergy);
      }
      cuEnergy = Number(item.energy);
      let has = DATA_HOLIDAY.some(
        (o) => new Date(o).toDateString() == new Date(item.date).toDateString()
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
    let dataMonthTotal = monthlyData[monthKey];
    let newDataMonthTotal = {
      date: dataMonthTotal.date,
      unitTotal: parseFloat(dataMonthTotal.unitTotal.toFixed(2)),
      priceTotal: parseFloat(dataMonthTotal.priceTotal.toFixed(2)),
      onPeak: {
        unit: parseFloat(dataMonthTotal.onPeak.unit.toFixed(2)),
        price: parseFloat(dataMonthTotal.onPeak.price.toFixed(2)),
        hour: dataMonthTotal.onPeak.hour,
      },
      offPeak: {
        unit: parseFloat(dataMonthTotal.offPeak.unit.toFixed(2)),
        price: parseFloat(dataMonthTotal.offPeak.price.toFixed(2)),
        hour: dataMonthTotal.offPeak.hour,
      },
      fee: parseFloat(dataMonthTotal.fee.toFixed(2)),
      summary: parseFloat(dataMonthTotal.summary.toFixed(2)),
    };

    DataMonth.push(newDataMonthTotal);
  }
  return DataMonth;
}
export function getCustomerById(id: string): Data | undefined {
  return customerData.find((item: { id: string }) => item.id === id);
}
export function getCustomerAll(): typeof customerData {
  return customerData;
}

