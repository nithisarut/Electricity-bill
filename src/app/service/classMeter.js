"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeterNomal = exports.MeterTypeTOU = void 0;
var data_dayoff_1 = require("../../assets/data_dayoff");
var DATE_FOCUS;
(function (DATE_FOCUS) {
    DATE_FOCUS[DATE_FOCUS["SAT_SUN"] = 0] = "SAT_SUN";
    DATE_FOCUS[DATE_FOCUS["MON_FRI1"] = 1] = "MON_FRI1";
})(DATE_FOCUS || (DATE_FOCUS = {}));
var DATE_PERIOD;
(function (DATE_PERIOD) {
    DATE_PERIOD[DATE_PERIOD["ALL_DAY1"] = 0] = "ALL_DAY1";
    DATE_PERIOD[DATE_PERIOD["OFF_PEAK1"] = 1] = "OFF_PEAK1";
    DATE_PERIOD[DATE_PERIOD["ON_PEAK1"] = 2] = "ON_PEAK1";
})(DATE_PERIOD || (DATE_PERIOD = {}));
var MeterValueData = /** @class */ (function () {
    function MeterValueData(volt) {
        this._dayoff = [0, 6];
        this._onpeak = [9, 22];
        this.volt = volt;
    }
    MeterValueData.prototype.Unit = function () {
        return this.volt / 1000;
    };
    MeterValueData.prototype.Volt = function () {
        return this.volt;
    };
    MeterValueData.prototype.Fee = function () {
        return 1;
    };
    MeterValueData.prototype.Hour = function () {
        return 1;
    };
    MeterValueData.prototype.ConstTOU = function (date) {
        var dateType = DATE_FOCUS.SAT_SUN;
        var period = DATE_PERIOD.ALL_DAY1;
        if (!data_dayoff_1.DATA_HOLIDAY.includes(date.toString())) {
            if (!this._dayoff.includes(date.getDay())) {
                var hour = date.getHours();
                dateType = DATE_FOCUS.MON_FRI1;
                period =
                    hour > this._onpeak[0] && hour < this._onpeak[1]
                        ? DATE_PERIOD.ON_PEAK1
                        : DATE_PERIOD.OFF_PEAK1;
            }
        }
        return { dateType: dateType, period: period };
    };
    return MeterValueData;
}());
var MeterTypeTOU = /** @class */ (function (_super) {
    __extends(MeterTypeTOU, _super);
    function MeterTypeTOU(opt) {
        var _this = _super.call(this, opt.energy) || this;
        _this.Service_Fee = {
            '12-24': {
                type: '12-24',
                onPeak: 5.1135,
                offPeak: 2.6037,
                val: 312.24,
            },
            'lower-12': {
                type: 'lower-12',
                onPeak: 5.7982,
                offPeak: 2.6369,
                val: 24.62,
            },
        };
        _this.id = opt.id;
        _this.type = opt.type;
        _this.name = opt.name;
        _this.date = new Date(opt.date);
        _this.volt = opt.energy;
        return _this;
    }
    MeterTypeTOU.prototype.PriceTotal = function () {
        var _this = this;
        var eng = _super.prototype.Unit.call(this);
        var _a = this.ConstTOU(this.date), dateType = _a.dateType, period = _a.period;
        var fee = this.Service_Fee[this.type];
        var has = data_dayoff_1.DATA_HOLIDAY.some(function (o) { return new Date(o).toDateString() == new Date(_this.date).toDateString(); });
        if (dateType == DATE_FOCUS.SAT_SUN || has)
            return eng * fee.offPeak;
        if (dateType == DATE_FOCUS.MON_FRI1 && !has) {
            if (period == DATE_PERIOD.ON_PEAK1) {
                return eng * fee.onPeak;
            }
            if (period == DATE_PERIOD.OFF_PEAK1) {
                return eng * fee.offPeak;
            }
        }
        return eng;
    };
    MeterTypeTOU.prototype.UnitTotal = function () {
        var eng = _super.prototype.Unit.call(this);
        return eng;
    };
    MeterTypeTOU.prototype.UnitOnPeak = function () {
        var _this = this;
        var eng = _super.prototype.Unit.call(this);
        var _a = this.ConstTOU(this.date), dateType = _a.dateType, period = _a.period;
        var unit = 0;
        var has = data_dayoff_1.DATA_HOLIDAY.some(function (o) { return new Date(o).toDateString() == new Date(_this.date).toDateString(); });
        if (dateType == DATE_FOCUS.MON_FRI1 &&
            period == DATE_PERIOD.ON_PEAK1 &&
            !has) {
            unit = eng;
        }
        return unit;
    };
    MeterTypeTOU.prototype.UnitOffPeack = function () {
        var _this = this;
        var eng = _super.prototype.Unit.call(this);
        var _a = this.ConstTOU(this.date), dateType = _a.dateType, period = _a.period;
        var unit = 0;
        var has = data_dayoff_1.DATA_HOLIDAY.some(function (o) { return new Date(o).toDateString() == new Date(_this.date).toDateString(); });
        if (dateType == DATE_FOCUS.MON_FRI1 &&
            period == DATE_PERIOD.OFF_PEAK1 &&
            !has) {
            unit = eng;
        }
        return unit;
    };
    MeterTypeTOU.prototype.UnitHoliday = function () {
        var _this = this;
        var eng = _super.prototype.Unit.call(this);
        var _a = this.ConstTOU(this.date), dateType = _a.dateType, period = _a.period;
        var unit = 0;
        var has = data_dayoff_1.DATA_HOLIDAY.some(function (o) { return new Date(o).toDateString() == new Date(_this.date).toDateString(); });
        if (dateType == DATE_FOCUS.SAT_SUN || has) {
            unit = eng;
        }
        return unit;
    };
    MeterTypeTOU.prototype.PriceOnPeak = function () {
        var _this = this;
        var eng = _super.prototype.Unit.call(this);
        var _a = this.ConstTOU(this.date), period = _a.period, dateType = _a.dateType;
        var fee = this.Service_Fee[this.type];
        var unit = 0;
        var has = data_dayoff_1.DATA_HOLIDAY.some(function (o) { return new Date(o).toDateString() == new Date(_this.date).toDateString(); });
        if (dateType == DATE_FOCUS.MON_FRI1 &&
            period == DATE_PERIOD.ON_PEAK1 &&
            !has) {
            unit = eng * fee.onPeak;
        }
        return unit;
    };
    MeterTypeTOU.prototype.PriceOffPeak = function () {
        var _this = this;
        var eng = _super.prototype.Unit.call(this);
        var _a = this.ConstTOU(this.date), period = _a.period, dateType = _a.dateType;
        var fee = this.Service_Fee[this.type];
        var has = data_dayoff_1.DATA_HOLIDAY.some(function (o) { return new Date(o).toDateString() == new Date(_this.date).toDateString(); });
        var unit = 0;
        if (dateType == DATE_FOCUS.MON_FRI1 &&
            period == DATE_PERIOD.OFF_PEAK1 &&
            !has) {
            unit = eng * fee.offPeak;
        }
        return unit;
    };
    MeterTypeTOU.prototype.PriceHoliday = function () {
        var _this = this;
        var eng = _super.prototype.Unit.call(this);
        var dateType = this.ConstTOU(this.date).dateType;
        var unit = 0;
        var fee = this.Service_Fee[this.type];
        var has = data_dayoff_1.DATA_HOLIDAY.some(function (o) { return new Date(o).toDateString() == new Date(_this.date).toDateString(); });
        if (dateType == DATE_FOCUS.SAT_SUN || has) {
            unit = eng * fee.offPeak;
        }
        return unit;
    };
    MeterTypeTOU.prototype.Fee = function () {
        var fee = this.Service_Fee[this.type];
        return fee.val;
    };
    return MeterTypeTOU;
}(MeterValueData));
exports.MeterTypeTOU = MeterTypeTOU;
var MeterNomal = /** @class */ (function (_super) {
    __extends(MeterNomal, _super);
    function MeterNomal(opt) {
        var _this = _super.call(this, opt.energy) || this;
        _this.nomalFee = {
            below150: {
                type: 'below150',
                fee15: 2.3488,
                fee25: 2.9882,
                fee35: 3.2405,
                fee100: 3.6237,
                fee150: 3.7171,
                fee400: 4.2218,
                fee401: 4.4217,
                val: 8.19,
            },
            over150: {
                type: 'over150',
                fee15: 3.2484,
                fee25: 3.2484,
                fee35: 3.2484,
                fee100: 3.2484,
                fee150: 3.2484,
                fee400: 4.2218,
                fee401: 4.4217,
                val: 24.62,
            },
        };
        _this.id = opt.id;
        _this.type = opt.type;
        _this.name = opt.name;
        _this.date = new Date(opt.date);
        _this.voltage = opt.energy;
        return _this;
    }
    MeterNomal.prototype.ElectricityBillBelow = function (unit) {
        var eng = _super.prototype.Unit.call(this);
        var fee = this.nomalFee[this.type];
        if (unit <= 15) {
            return unit * fee.fee15;
        }
        else if (unit <= 25) {
            return 15 * fee.fee15 + (unit - 15) * fee.fee25;
        }
        else if (unit <= 35) {
            return 15 * fee.fee15 + 10 * fee.fee25 + (unit - 25) * fee.fee35;
        }
        else if (unit <= 100) {
            return (15 * fee.fee15 +
                10 * fee.fee25 +
                10 * fee.fee35 +
                (unit - 35) * fee.fee100);
        }
        else if (unit <= 150) {
            return (15 * fee.fee15 +
                10 * fee.fee25 +
                10 * fee.fee35 +
                65 * fee.fee100 +
                (unit - 100) * fee.fee150);
        }
        else if (unit <= 400) {
            return (15 * fee.fee15 +
                10 * fee.fee25 +
                10 * fee.fee35 +
                65 * fee.fee100 +
                50 * fee.fee150 +
                (unit - 150) * fee.fee400);
        }
        else {
            return (15 * fee.fee15 +
                10 * fee.fee25 +
                10 * fee.fee35 +
                65 * fee.fee100 +
                50 * fee.fee150 +
                250 * fee.fee400 +
                (unit - 400) * fee.fee401);
        }
    };
    MeterNomal.prototype.Unit = function () {
        var eng = _super.prototype.Unit.call(this);
        return eng;
    };
    MeterNomal.prototype.Fee = function () {
        var fee = this.nomalFee[this.type];
        return fee.val;
    };
    return MeterNomal;
}(MeterValueData));
exports.MeterNomal = MeterNomal;
