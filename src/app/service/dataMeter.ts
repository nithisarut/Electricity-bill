import { MeterNormal, MeterTypeTOU } from './classMeter';
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
let hometype = 'Normal';

interface Data {
  id: string;
  name: string;
  lastname: string;
  type_home: string;
  type_meter: string;
}
interface datadayweekMonth {
  chartDay: ChartData[];
  chartWeek: ChartData[];
  chartMonth: ChartDataWithSummary[];
}
interface ChartData {
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
}

interface ChartDataWithSummary extends ChartData {
  fee: number;
  summary: number;
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
  let monthlyData: Record<string, any> = {};
  let monthlyData1: Record<string, any> = {};
  let currDate: string = '',
    energyNormal: number = 0,
    energy: number = 0,
    cuEnergy: number = 0,
    totalUnit = 0,
    engUnit = 0,
    totalOnpeak = 0,
    totalOffpeak = 0,
    totalHoliday = 0;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const currentTime = new Date(item.datetime);
    let curr = new Date(item.datetime);
    let month = curr.getMonth();

    if (currentTime >= sd && currentTime <= ed) {
      let monthKey = `${curr.getFullYear()}-${month + 1}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = createMonthlyDataObject();
      }

      if (!currDate.length) {
        currDate = curr.toDateString();
      }

      energyNormal = Number(item.energy);
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

        let unit = calc.Unit(),
          price = calc.PriceTotal(),
          fee = calc.Fee(),
          onPeak = calc.PriceOnPeak(),
          offpeak = calc.PriceOffPeak(),
          holiday = calc.PriceHoliday();

        totalUnit += price;
        totalOnpeak += onPeak;
        totalOffpeak += offpeak;
        totalHoliday += holiday;

        monthlyData[monthKey].unit += unit;
        monthlyData[monthKey].priceTotal += price;
        monthlyData[monthKey].onpeakTotal += onPeak;
        monthlyData[monthKey].offpeakTotal += offpeak + holiday;
        monthlyData[monthKey].fee = fee;
        monthlyData[monthKey].summary =
          monthlyData[monthKey].priceTotal + monthlyData[monthKey].fee;
      } else if (hometype == 'Normal') {
        let calc = new MeterNormal({
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

    energyNormal = Number(currentItem.energy);

    if (i === 0) {
      energy = currentItem.energy - 0;
    } else {
      const previousItem = data[i - 1];
      const previousEnergy = previousItem.energy;
      energy = Number(currentItem.energy - previousEnergy);
    }
    if (!monthlyData1[monthKey1]) {
      monthlyData1[monthKey1] = createMonthlyDataObject();
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
    } else if (hometype == 'Normal') {
      let calc = new MeterNormal({
        id: 0,
        type: metertype,
        name: 'AAA',
        date: data[i].datetime,
        energy: energy,
      });

      let unit = calc.Unit(),
        fee = calc.Fee();
      engUnit += unit;
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
  let hourOn = 0,
    hourOff = 0,
    hourOnWeek = 0,
    hourOffWeek = 0,
    hourOnMonth = 0,
    hourOffMonth = 0,
    prevMonth = -1,
    currDate: string = '',
    energyNormal: number = 0,
    energy: number = 0,
    cuEnergy: number = 0,
    daysPassed = 0;

  let dailyTotals: Record<string, any> = {};
  let weeklyData: Record<string, any> = {};
  let monthlyData: Record<string, any> = {};

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const currentTime = new Date(item.datetime);
    let curr = new Date(item.datetime),
      month = curr.getMonth(),
      day = curr.getDay(),
      hours = curr.getHours(),
      minute = curr.getMinutes();
    if (currentTime >= sd && currentTime <= ed) {
      let weekStart = new Date(
        curr.getFullYear(),
        curr.getMonth(),
        curr.getDate() - curr.getDay()
      );
      let monthKey = `${curr.getFullYear()}-${month + 1}`,
        weekKey = `${weekStart.toDateString()}`,
        dayKey = curr.toDateString();

      if (hours == 0 && minute == 0) {
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
        hourOnMonth = 0;
        hourOffMonth = 0;
        prevMonth = month;
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

      dailyTotals[dayKey] ||= {
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

      weeklyData[weekKey] ||= {
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

      monthlyData[monthKey] ||= {
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

      if (!currDate.length) {
        currDate = curr.toDateString();
      }
      energyNormal = Number(item.energy);
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
        let {
          unitTotal,
          priceTotal,
          unitOnpeak,
          priceOnpeak,
          unitOffpeak,
          priceOffpeak,
          unitHoliday,
          priceHoliday,
          fee,
        } = calc.calculate();
        
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
      } else if (hometype == 'Normal') {
        let calc = new MeterNormal({
          id: 0,
          type: metertype,
          name: 'AAA',
          date: item.datetime,
          energy: energy,
        });

        let UnitTotal = calc.Unit(),
          fee = calc.Fee(),
          dateOnly = new Date(curr).toISOString().split('T')[0];

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
    DataDayWeekMonth.chartDay.push(formatData(dailyTotals[dayKey]));
  }
  for (let weekKey in weeklyData) {
    DataDayWeekMonth.chartWeek.push(formatData(weeklyData[weekKey]));
  }
  for (let monthKey in monthlyData) {
    DataDayWeekMonth.chartMonth.push(formatData(monthlyData[monthKey]));
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
  const monthlyData: Record<string, any> = {};
  let currDate: string = '',
    energy: number = 0,
    cuEnergy: number = 0,
    energyNormal: number = 0,
    hourOn = 0,
    hourOff = 0,
    prevMonth = -1;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const currentTime = new Date(item.datetime);
    let curr = new Date(item.datetime),
      month = curr.getMonth(),
      day = curr.getDay(),
      hours = curr.getHours(),
      minute = curr.getMinutes();

    if (currentTime >= sd && currentTime <= ed) {
      let monthKey = `${curr.getFullYear()}-${curr.getMonth() + 1}`;

      monthlyData[monthKey] ||= {
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

      if (!currDate.length) {
        currDate = curr.toDateString();
      }

      energyNormal = Number(item.energy);

      if (i === 0) {
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
        let untiTotal = calc.Unit(),
          unitPrice = calc.PriceTotal(),
          onPeack = calc.PriceOnPeak(),
          OffPeack = calc.PriceOffPeak(),
          holiday = calc.PriceHoliday(),
          unitOnpeak = calc.UnitOnPeak(),
          unitOffpeak = calc.UnitOffPeack(),
          unitHoliday = calc.UnitHoliday(),
          fee = calc.Fee();

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
      } else if (hometype == 'Normal') {
        let calc = new MeterNormal({
          id: 0,
          type: metertype,
          name: 'AAA',
          date: item.datetime,
          energy: energy,
        });
        let unitTotal = calc.Unit(),
          fee = calc.Fee();
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
    DataMonth.push(formatData(monthlyData[monthKey]));
  }

  return DataMonth;
}
export function getCustomerById(id: string): Data | undefined {
  return customerData.find((item: { id: string }) => item.id === id);
}
export function getCustomerAll(): typeof customerData {
  return customerData;
}
function createMonthlyDataObject() {
  return {
    unit: 0,
    priceTotal: 0,
    onpeakTotal: 0,
    offpeakTotal: 0,
    fee: 0,
    summary: 0,
  };
}
function formatData(data: any) {
  return {
    date: data.date,
    unitTotal: parseFloat(data.unitTotal.toFixed(2)),
    priceTotal: parseFloat(data.priceTotal.toFixed(2)),
    onPeak: {
      unit: parseFloat(data.onPeak.unit.toFixed(2)),
      hour: data.onPeak.hour,
      price: parseFloat(data.onPeak.price.toFixed(2)),
    },
    offPeak: {
      unit: parseFloat(data.offPeak.unit.toFixed(2)),
      hour: data.offPeak.hour,
      price: parseFloat(data.offPeak.price.toFixed(2)),
    },
    fee: data.fee ? parseFloat(data.fee.toFixed(2)) : 0,
    summary: data.summary ? parseFloat(data.summary.toFixed(2)) : 0,
  };
}
