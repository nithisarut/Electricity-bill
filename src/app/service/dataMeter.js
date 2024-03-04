"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var classMeter_1 = require("./classMeter");
var data_dayoff_1 = require("../../assets/data_dayoff");
var fs_1 = require("fs");
var express = require('express');
var cors = require('cors');
var app = express();
app.use(cors());
(0, fs_1.readFile)('../../assets/data_power_meter.json', 'utf8', function (err, datajson) {
    if (err) {
        console.error('เกิดข้อผิดพลาดในการอ่านไฟล์', err);
        return;
    }
    var jsonData = JSON.parse(datajson);
    var sd = new Date('2023-01-01 00:00:00');
    var ed = new Date('2023-01-31 23:59:59');
    var data = jsonData;
    var metertype = 'over150';
    var hometype = 'Nomal';
    var DataMonthTOU = [];
    var DataDayWeekMonth = {
        chartDay: [],
        chartWeek: [],
        chartMonth: [],
    };
    var DataMonth = [];
    var daysOfWeek = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
    ];
    function getCurrentCost(data, sd, ed, metertype, hometype) {
        var monthlyData = {};
        var yearData = {};
        var currDate = '';
        var energyNomal = 0;
        var energy = 0;
        var cuEnergy = 0;
        var totalUnit = 0;
        var engUnit = 0;
        var totalOnpeak = 0;
        var totalOffpeak = 0;
        var totalHoliday = 0;
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
            var item = data_1[_i];
            var curr = new Date(item.datetime);
            var time = curr.getTime();
            var month = curr.getMonth();
            var hour = curr.getHours();
            var minute = curr.getMinutes();
            if (sd.getTime() <= time && ed.getTime() >= time) {
                var monthKey = " ".concat(curr.getFullYear(), "-").concat(month + 1);
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
                energy = Number(item.energy - cuEnergy);
                cuEnergy = Number(item.energy);
                if (hometype == 'TOU') {
                    var calc = new classMeter_1.MeterTypeTOU({
                        id: 0,
                        type: metertype,
                        name: 'AAA',
                        date: item.datetime,
                        energy: energy,
                    });
                    var unit = calc.Unit();
                    var price = calc.PriceTotal();
                    totalUnit += price;
                    var fee = calc.Fee();
                    // console.log('fee :', fee);
                    var onPeak = calc.PriceOnPeak();
                    totalOnpeak += onPeak;
                    var offpeak = calc.PriceOffPeak();
                    totalOffpeak += offpeak;
                    var holiday = calc.PriceHoliday();
                    totalHoliday += holiday;
                    monthlyData[monthKey].unit += unit;
                    monthlyData[monthKey].priceTotal += price;
                    monthlyData[monthKey].onpeakTotal += onPeak;
                    monthlyData[monthKey].offpeakTotal += offpeak + holiday;
                    monthlyData[monthKey].fee = fee;
                    monthlyData[monthKey].summary =
                        monthlyData[monthKey].priceTotal + monthlyData[monthKey].fee;
                }
                else if (hometype == 'Nomal') {
                    var calc = new classMeter_1.MeterNomal({
                        id: 0,
                        type: metertype,
                        name: 'AAA',
                        date: item.datetime,
                        energy: energy,
                    });
                    var unit = calc.Unit();
                    engUnit += unit;
                    var fee = calc.Fee();
                    // console.log('engUnit :', engUnit);
                    totalUnit = calc.ElectricityBillBelow(engUnit);
                    monthlyData[monthKey].unit += unit;
                    monthlyData[monthKey].priceTotal = calc.ElectricityBillBelow(monthlyData[monthKey].unit);
                    monthlyData[monthKey].fee = fee;
                    monthlyData[monthKey].summary =
                        monthlyData[monthKey].priceTotal + monthlyData[monthKey].fee;
                }
            }
        }
        var summaryTotal = 0;
        var billNow = 0;
        for (var item in monthlyData) {
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
    function getdataDayWeekMonth(data, sd, ed, metertype, hometype) {
        var currDate = '';
        var energyNomal = 0;
        var energy = 0;
        var cuEnergy = 0;
        var hourOn = 0;
        var hourOff = 0;
        var hourOnWeek = 0;
        var hourOffWeek = 0;
        var hourOnMonth = 0;
        var hourOffMonth = 0;
        var prevMonth = -1;
        var totalUnit = 0;
        var totalOnpeak = 0;
        var totalOffpeak = 0;
        var totalHoliday = 0;
        var dailyTotals = {};
        var weeklyData = {};
        var monthlyData = {};
        var daysPassed = 0;
        var _loop_1 = function (item) {
            var curr = new Date(item.datetime);
            var time = curr.getTime();
            var month = curr.getMonth();
            var day = curr.getDay();
            var hours = curr.getHours();
            var minute = curr.getMinutes();
            if (sd.getTime() <= time && ed.getTime() >= time) {
                var monthKey = "".concat(curr.getFullYear(), "-").concat(month + 1);
                var weekStart = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate() - curr.getDay()); // วันเริ่มต้นของสัปดาห์
                var weekKey = "".concat(weekStart.toDateString());
                var dayKey = curr.toDateString();
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
                var has = data_dayoff_1.DATA_HOLIDAY.some(function (o) {
                    return new Date(o).toDateString() == new Date(item.datetime).toDateString();
                });
                if (!has) {
                    if (day == 0 || day == 6) {
                        if (minute == 55) {
                            hourOff++;
                            hourOffMonth++;
                            hourOffWeek++;
                        }
                    }
                    else {
                        if (hours >= 9 && hours < 22) {
                            if (minute == 55) {
                                hourOn++;
                                hourOnMonth++;
                                hourOnWeek++;
                            }
                        }
                        else {
                            if (minute == 55) {
                                hourOff++;
                                hourOffMonth++;
                                hourOffWeek++;
                            }
                        }
                    }
                }
                else {
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
                    var calc = new classMeter_1.MeterTypeTOU({
                        id: 0,
                        type: metertype,
                        name: 'AAA',
                        date: item.datetime,
                        energy: energy,
                    });
                    var unitTotal = calc.UnitTotal();
                    var priceTotal = calc.PriceTotal();
                    var unitOnpeak = calc.UnitOnPeak();
                    var priceOnpeak = calc.PriceOnPeak();
                    var unitOffpeak = calc.UnitOffPeack();
                    var priceOffpeak = calc.PriceOffPeak();
                    var unitHoliday = calc.UnitHoliday();
                    var priceHoliday = calc.PriceHoliday();
                    var fee = calc.Fee();
                    var dateOnly = new Date(curr).toISOString().split('T')[0];
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
                }
                else if (hometype == 'Nomal') {
                    var calc = new classMeter_1.MeterNomal({
                        id: 0,
                        type: metertype,
                        name: 'AAA',
                        date: item.datetime,
                        energy: energy,
                    });
                    var UnitTotal = calc.Unit();
                    var fee = calc.Fee();
                    var dateOnly = new Date(curr).toISOString().split('T')[0];
                    dailyTotals[dayKey].date = dateOnly;
                    dailyTotals[dayKey].unitTotal += UnitTotal;
                    dailyTotals[dayKey].priceTotal = calc.ElectricityBillBelow(UnitTotal);
                    weeklyData[weekKey].date = dateOnly;
                    weeklyData[weekKey].unitTotal += UnitTotal;
                    weeklyData[weekKey].priceTotal = calc.ElectricityBillBelow(weeklyData[weekKey].unitTotal);
                    monthlyData[monthKey].date = dateOnly;
                    monthlyData[monthKey].unitTotal += UnitTotal;
                    monthlyData[monthKey].priceTotal = calc.ElectricityBillBelow(monthlyData[monthKey].unitTotal);
                    var test = calc.ElectricityBillBelow(449.7526391459991);
                    monthlyData[monthKey].fee = fee;
                    monthlyData[monthKey].summary =
                        monthlyData[monthKey].priceTotal + monthlyData[monthKey].fee;
                }
            }
        };
        for (var _i = 0, data_2 = data; _i < data_2.length; _i++) {
            var item = data_2[_i];
            _loop_1(item);
        }
        for (var dayKey in dailyTotals) {
            var dailyTotal = dailyTotals[dayKey];
            DataDayWeekMonth.chartDay.push(dailyTotal);
        }
        for (var weekKey in weeklyData) {
            var weekTotal = weeklyData[weekKey];
            var weekUnit = DataDayWeekMonth.chartWeek.push(weekTotal);
        }
        for (var monthKey in monthlyData) {
            var monthTotal = monthlyData[monthKey];
            DataDayWeekMonth.chartMonth.push(monthTotal);
        }
        console.log('monthlyData :', monthlyData);
        return DataDayWeekMonth;
    }
    function getdataMonth(data, sd, ed, metertype, hometype) {
        var currDate = '';
        var energy = 0;
        var cuEnergy = 0;
        var energyNomal = 0;
        var monthlyData = {};
        var hourOn = 0;
        var hourOff = 0;
        var prevMonth = -1;
        var _loop_2 = function (item) {
            var curr = new Date(item.datetime);
            var time = curr.getTime();
            var month = curr.getMonth();
            var day = curr.getDay();
            var hours = curr.getHours();
            var minute = curr.getMinutes();
            if (sd.getTime() <= time && ed.getTime() >= time) {
                var monthKey = " ".concat(curr.getFullYear(), "-").concat(curr.getMonth() + 1);
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
                var calc = new classMeter_1.MeterTypeTOU({
                    id: 0,
                    type: metertype,
                    name: 'AAA',
                    date: item.datetime,
                    energy: energy,
                });
                var has = data_dayoff_1.DATA_HOLIDAY.some(function (o) {
                    return new Date(o).toDateString() == new Date(item.date).toDateString();
                });
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
                    }
                    else {
                        if (hours >= 9 && hours < 22) {
                            if (minute == 55) {
                                hourOn++;
                            }
                        }
                        else {
                            if (minute == 55) {
                                hourOff++;
                            }
                        }
                    }
                }
                else {
                    if (minute == 55) {
                        hourOff++;
                    }
                }
                if (hometype == 'TOU') {
                    var calc_1 = new classMeter_1.MeterTypeTOU({
                        id: 0,
                        type: metertype,
                        name: 'AAA',
                        date: item.datetime,
                        energy: energy,
                    });
                    var untiTotal = calc_1.Unit();
                    var unitPrice = calc_1.PriceTotal();
                    var onPeack = calc_1.PriceOnPeak();
                    var OffPeack = calc_1.PriceOffPeak();
                    var holiday = calc_1.PriceHoliday();
                    var unitOnpeak = calc_1.UnitOnPeak();
                    var unitOffpeak = calc_1.UnitOffPeack();
                    var unitHoliday = calc_1.UnitHoliday();
                    var fee = calc_1.Fee();
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
                }
                else if (hometype == 'Nomal') {
                    var calc_2 = new classMeter_1.MeterNomal({
                        id: 0,
                        type: metertype,
                        name: 'AAA',
                        date: item.datetime,
                        energy: energy,
                    });
                    var unitTotal = calc_2.Unit();
                    var fee = calc_2.Fee();
                    monthlyData[monthKey].unitTotal += unitTotal;
                    var priceTotal = calc_2.ElectricityBillBelow(monthlyData[monthKey].unitTotal);
                    var tset = calc_2.ElectricityBillBelow(449.7526391459991);
                    console.log('tset :', tset);
                    monthlyData[monthKey].priceTotal = priceTotal;
                    monthlyData[monthKey].fee = fee;
                    monthlyData[monthKey].summary =
                        monthlyData[monthKey].priceTotal + monthlyData[monthKey].fee;
                }
                var dateOnly = new Date(curr).toISOString().split('T')[0];
                monthlyData[monthKey].date = dateOnly;
            }
        };
        for (var _i = 0, data_3 = data; _i < data_3.length; _i++) {
            var item = data_3[_i];
            _loop_2(item);
        }
        for (var monthKey in monthlyData) {
            var dataMOnthTotal = monthlyData[monthKey];
            DataMonth.push(dataMOnthTotal);
        }
        return DataMonth;
        // console.log('monthlyData :', monthlyData);
    }
    // getCurrentCost(data, sd, ed, metertype, hometype);
    // getdataDayWeekMonth(data, sd, ed, metertype, hometype);
    // getdataMonth(data, sd, ed, metertype, hometype);
    // console.log('DataDayWeekMonth :', DataDayWeekMonth);
    app.get('/getCurrentCost', function (req, res) {
        var sd;
        var ed;
        var defaultStartDate = new Date('2023-01-01');
        var defaultEndDate = new Date('2023-12-30');
        var defaultHomeType = 'TOU';
        var defaultMeterTypeTOU = '12-24';
        var defaultMeterTypeNomal = 'below150';
        var metertype = req.query.metertype;
        var hometype = req.query.hometype;
        sd = req.query.sd ? new Date(req.query.sd) : defaultStartDate;
        ed = req.query.ed ? new Date(req.query.ed) : defaultEndDate;
        hometype = hometype || defaultHomeType;
        if (!metertype && hometype === 'TOU') {
            metertype = defaultMeterTypeTOU;
        }
        else if (!metertype && hometype === 'Nomal') {
            metertype = defaultMeterTypeNomal;
        }
        DataMonthTOU = [];
        var result = getCurrentCost(data, sd, ed, metertype, hometype);
        res.json(result);
    });
    app.get('/getdataDayWeekMonth', function (req, res) {
        var sd;
        var ed;
        var defaultStartDate = new Date('2023-01-01');
        var defaultEndDate = new Date('2023-12-30 23:59:59');
        var defaultHomeType = 'TOU';
        var defaultMeterTypeTOU = '12-24';
        var defaultMeterTypeNomal = 'below150';
        var metertype = req.query.metertype;
        var hometype = req.query.hometype;
        sd = req.query.sd ? new Date(req.query.sd) : defaultStartDate;
        ed = req.query.ed ? new Date(req.query.ed) : defaultEndDate;
        hometype = hometype || defaultHomeType;
        if (!metertype && hometype === 'TOU') {
            metertype = defaultMeterTypeTOU;
        }
        else if (!metertype && hometype === 'Nomal') {
            metertype = defaultMeterTypeNomal;
        }
        DataDayWeekMonth = {
            chartDay: [],
            chartWeek: [],
            chartMonth: [],
        };
        var result = getdataDayWeekMonth(data, sd, ed, metertype, hometype);
        res.json(result);
    });
    app.get('/getdataMonth', function (req, res) {
        var sd;
        var ed;
        var defaultStartDate = new Date('2023-01-01');
        var defaultEndDate = new Date('2023-12-30');
        var defaultHomeType = 'TOU';
        var defaultMeterTypeTOU = '12-24';
        var defaultMeterTypeNomal = 'below150';
        var metertype = req.query.metertype;
        var hometype = req.query.hometype;
        sd = req.query.sd ? new Date(req.query.sd) : defaultStartDate;
        ed = req.query.ed ? new Date(req.query.ed) : defaultEndDate;
        hometype = hometype || defaultHomeType;
        if (!metertype && hometype === 'TOU') {
            metertype = defaultMeterTypeTOU;
        }
        else if (!metertype && hometype === 'Nomal') {
            metertype = defaultMeterTypeNomal;
        }
        DataMonth = [];
        var result = getdataMonth(data, sd, ed, metertype, hometype);
        res.json(result);
    });
    var PORT = process.env['PORT'] || 3002;
    app.listen(PORT, function () {
        console.log("Server is running on port ".concat(PORT));
    });
    module.exports = getCurrentCost;
    module.exports = { getdataDayWeekMonth: getdataDayWeekMonth };
});
