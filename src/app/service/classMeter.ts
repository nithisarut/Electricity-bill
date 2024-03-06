import { DATA_HOLIDAY } from '../../assets/data_dayoff';

enum DATE_FOCUS {
  SAT_SUN = 0,
  MON_FRI1 = 1,
}
enum DATE_PERIOD {
  ALL_DAY1 = 0,
  OFF_PEAK1 = 1,
  ON_PEAK1 = 2,
}

type MeterOptions1 = {
  id: number | string;
  type: any;
  name: string;
  date: string | Date;
  energy: number;
};

class MeterValueData {
  volt: number;

  constructor(volt: number) {
    this.volt = volt;
  }
  private _dayoff: number[] = [0, 6];
  private _onpeak: number[] = [9, 22];
  Unit(): number {
    return this.volt / 1000;
  }
  Volt(): number {
    return this.volt;
  }
  Fee(): number {
    return 1;
  }
  Hour(): number {
    return 1;
  }
  ConstTOU(date: Date): {
    dateType: DATE_FOCUS;
    period: DATE_PERIOD;
  } {
    let dateType: DATE_FOCUS = DATE_FOCUS.SAT_SUN;
    let period: DATE_PERIOD = DATE_PERIOD.ALL_DAY1;
    if (!DATA_HOLIDAY.includes(date.toString())) {
      if (!this._dayoff.includes(date.getDay())) {
        let hour = date.getHours();
        dateType = DATE_FOCUS.MON_FRI1;
        period =
          hour > this._onpeak[0] && hour < this._onpeak[1]
            ? DATE_PERIOD.ON_PEAK1
            : DATE_PERIOD.OFF_PEAK1;
      }
    }
    return { dateType, period };
  }
}

export class MeterTypeTOU extends MeterValueData {
  private Service_Fee = {
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
  id: number | string;
  typeHome: any;
  type: '12-24' | 'lower-12';
  name: string;
  date: Date;

  constructor(opt: MeterOptions1) {
    super(opt.energy);
    this.id = opt.id;
    this.type = opt.type;
    this.name = opt.name;
    this.date = new Date(opt.date);
    this.volt = opt.energy;
  }
  PriceTotal(): number {
    let eng = super.Unit();
    let { dateType, period } = this.ConstTOU(this.date);
    let fee = this.Service_Fee[this.type];
    let has = DATA_HOLIDAY.some(
      (o) => new Date(o).toDateString() == new Date(this.date).toDateString()
    );
    if (dateType == DATE_FOCUS.SAT_SUN || has) return eng * fee.offPeak;
    if (dateType == DATE_FOCUS.MON_FRI1 && !has) {
      if (period == DATE_PERIOD.ON_PEAK1) {
        return eng * fee.onPeak;
      }
      if (period == DATE_PERIOD.OFF_PEAK1) {
        return eng * fee.offPeak;
      }
    }
    return eng;
  }
  UnitTotal(): number {
    let eng = super.Unit();
    return eng;
  }
  UnitOnPeak(): number {
    let eng = super.Unit();
    let { dateType, period } = this.ConstTOU(this.date);
    let unit = 0;
    let has = DATA_HOLIDAY.some(
      (o) => new Date(o).toDateString() == new Date(this.date).toDateString()
    );
    if (
      dateType == DATE_FOCUS.MON_FRI1 &&
      period == DATE_PERIOD.ON_PEAK1 &&
      !has
    ) {
      unit = eng
    }

    return unit;
  }
  UnitOffPeack(): number {
    let eng = super.Unit();
    let { dateType, period } = this.ConstTOU(this.date);
    let unit = 0;
    let has = DATA_HOLIDAY.some(
      (o) => new Date(o).toDateString() == new Date(this.date).toDateString()
    );
    if (
      dateType == DATE_FOCUS.MON_FRI1 &&
      period == DATE_PERIOD.OFF_PEAK1 &&
      !has
    ) {
      unit = eng;
    }
    return unit;
  }

  UnitHoliday(): number {
    let eng = super.Unit();
    let { dateType, period } = this.ConstTOU(this.date);
    let unit = 0;
    let has = DATA_HOLIDAY.some(
      (o) => new Date(o).toDateString() == new Date(this.date).toDateString()
    );
    if (dateType == DATE_FOCUS.SAT_SUN || has) {
      unit = eng;
    }
    return unit;
  }

  PriceOnPeak(): number {
    let eng = super.Unit();
    let { period, dateType } = this.ConstTOU(this.date);
    let fee = this.Service_Fee[this.type];
    let unit: number = 0;
    let has = DATA_HOLIDAY.some(
      (o) => new Date(o).toDateString() == new Date(this.date).toDateString()
    );
    if (
      dateType == DATE_FOCUS.MON_FRI1 &&
      period == DATE_PERIOD.ON_PEAK1 &&
      !has
    ) {
      unit = eng * fee.onPeak;
    }
    return unit;
  }
  PriceOffPeak(): number {
    let eng = super.Unit();
    let { period, dateType } = this.ConstTOU(this.date);
    let fee = this.Service_Fee[this.type];
    let has = DATA_HOLIDAY.some(
      (o) => new Date(o).toDateString() == new Date(this.date).toDateString()
    );
    let unit: number = 0;
    if (
      dateType == DATE_FOCUS.MON_FRI1 &&
      period == DATE_PERIOD.OFF_PEAK1 &&
      !has
    ) {
      unit = eng * fee.offPeak;
    }
    return unit;
  }

  PriceHoliday(): number {
    let eng = super.Unit();
    let { dateType } = this.ConstTOU(this.date);
    let unit: number = 0;
    let fee = this.Service_Fee[this.type];
    let has = DATA_HOLIDAY.some(
      (o) => new Date(o).toDateString() == new Date(this.date).toDateString()
    );
    if (dateType == DATE_FOCUS.SAT_SUN || has) {
      unit = eng * fee.offPeak;
    }
    return unit;
  }
  override Fee(): number {
    let fee = this.Service_Fee[this.type];
    return fee.val;
  }

  calculate(): any {
    const eng = super.Unit();
    const { dateType, period } = this.ConstTOU(this.date);
    const fee = this.Service_Fee[this.type];
    const hasHoliday = DATA_HOLIDAY.some(
        (o) => new Date(o).toDateString() === this.date.toDateString()
    );

    let unitTotal = 0,
        priceTotal = 0,
        unitOnpeak = 0,
        priceOnpeak = 0,
        unitOffpeak = 0,
        priceOffpeak = 0,
        unitHoliday = 0,
        priceHoliday = 0,
        feeValue = fee.val;

    if (dateType === DATE_FOCUS.SAT_SUN || hasHoliday) {
        unitTotal = eng;
        priceTotal = eng * fee.offPeak;
    } else if (dateType === DATE_FOCUS.MON_FRI1 && !hasHoliday) {
        if (period === DATE_PERIOD.ON_PEAK1) {
            unitTotal = eng;
            priceTotal = eng * fee.onPeak;
        } else if (period === DATE_PERIOD.OFF_PEAK1) {
            unitTotal = eng;
            priceTotal = eng * fee.offPeak;
        }
    }

    if (period === DATE_PERIOD.ON_PEAK1 && !hasHoliday) {
        unitOnpeak = eng;
        priceOnpeak = eng * fee.onPeak;
    } else if (period === DATE_PERIOD.OFF_PEAK1 && !hasHoliday) {
        unitOffpeak = eng;
        priceOffpeak = eng * fee.offPeak;
    } else if (hasHoliday) {
        unitHoliday = eng;
        priceHoliday = eng * fee.offPeak;
    }

    return {
        unitTotal,
        priceTotal,
        unitOnpeak,
        priceOnpeak,
        unitOffpeak,
        priceOffpeak,
        unitHoliday,
        priceHoliday,
        fee: feeValue,
        summary: priceTotal + feeValue,
    };
}
}

export class MeterNormal extends MeterValueData {
  private normalFee = {
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
  id: number | string;
  type: 'below150' | 'over150';
  name: string;
  date: Date;
  voltage: any;
  constructor(opt: MeterOptions1) {
    super(opt.energy);
    this.id = opt.id;
    this.type = opt.type;
    this.name = opt.name;
    this.date = new Date(opt.date);
    this.voltage = opt.energy;
  }

  ElectricityBillBelow(unit:number): number {
    let eng = super.Unit();
    let fee = this.normalFee[this.type];
    if (unit <= 15) {
      return unit * fee.fee15;
    } else if (unit <= 25) {
      return 15 * fee.fee15 + (unit - 15) * fee.fee25;
    } else if (unit <= 35) {
      return 15 * fee.fee15 + 10 * fee.fee25 + (unit - 25) * fee.fee35;
    } else if (unit <= 100) {
      return (
        15 * fee.fee15 +
        10 * fee.fee25 +
        10 * fee.fee35 +
        (unit - 35) * fee.fee100
      );
    } else if (unit <= 150) {
      return (
        15 * fee.fee15 +
        10 * fee.fee25 +
        10 * fee.fee35 +
        65 * fee.fee100 +
        (unit - 100) * fee.fee150
      );
    } else if (unit <= 400) {
      return (
        15 * fee.fee15 +
        10 * fee.fee25 +
        10 * fee.fee35 +
        65 * fee.fee100 +
        50 * fee.fee150 +
        (unit - 150) * fee.fee400
      );
    } else {
      return (
        15 * fee.fee15 +
        10 * fee.fee25 +
        10 * fee.fee35 +
        65 * fee.fee100 +
        50 * fee.fee150 +
        250 * fee.fee400 +
        (unit - 400) * fee.fee401
      );
    }
  }
  override Unit(): number {
    let eng = super.Unit();
    return eng;
  }
  override Fee(): number {
    let fee = this.normalFee[this.type];
    return fee.val;
  }
}
