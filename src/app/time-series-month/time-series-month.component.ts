import { Component } from '@angular/core';
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5themes_Responsive from "@amcharts/amcharts5/themes/Responsive";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import { NgZone } from '@angular/core';
import { CostService } from '../cost.service';
@Component({
  selector: 'app-time-series-month',
  standalone: true,
  imports: [],
  templateUrl: './time-series-month.component.html',
  styleUrl: './time-series-month.component.css'
})
export class TimeSeriesMonthComponent {
  data: any = {};
  selected: string = 'chartDay';
  root: any;
  series: any;
  chart: any;

  constructor(private zone: NgZone, private costService: CostService) { }

  ngOnInit() {
    this.zone.runOutsideAngular(() => {
      window.requestAnimationFrame(() => {
        // this.createtimesiesData();
      });
    });
    this.initialCart();
    this.fetchData();
  }

  fetchData() {
    this.costService.getdataDayWeekMonth()
      .subscribe(
        (data) => {
          console.log()
          this.data = data;
          this.createtimesiesData(this.data[this.selected])
        },
        (error) => {
          console.error('Error fetching data:', error);
        }
      );
  }

  onChangeSelect(type: string) {
    this.selected = type;
    this.createtimesiesData(this.data[type]);
  }

  initialCart() {
    this.root = am5.Root.new("timesiesdiv");
    // Set themes
    this.root.setThemes([
      am5themes_Animated.new(this.root)
    ]);

    // Create chart
    this.chart = this.root.container.children.push(am5xy.XYChart.new(this.root, {
      panX: true,
      panY: true,
      wheelX: "panX",
      wheelY: "zoomX",
      pinchZoomX: true,
      paddingLeft: 0
    }));

    // Add cursor
    let cursor = this.chart.set("cursor", am5xy.XYCursor.new(this.root, {
      behavior: "none"
    }));
    cursor.lineY.set("visible", false);

    // Create axes
    let xAxis = this.chart.xAxes.push(am5xy.DateAxis.new(this.root, {
      maxDeviation: 0.2,
      baseInterval: {
        timeUnit: "day",
        count: 1
      },
      renderer: am5xy.AxisRendererX.new(this.root, {
        minorGridEnabled: true
      }),
      tooltip: am5.Tooltip.new(this.root, {})
    }));

    let yAxis = this.chart.yAxes.push(am5xy.ValueAxis.new(this.root, {
      renderer: am5xy.AxisRendererY.new(this.root, {
        pan: "zoom"
      })
    }));

    // Add series
    this.series = this.chart.series.push(am5xy.LineSeries.new(this.root, {
      name: "Series",
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "unitTotal",
      valueXField: "date",
      tooltip: am5.Tooltip.new(this.root, {
        labelText: "{valueY}"
      })
    }));

    // Add scrollbar
    this.chart.set("scrollbarX", am5.Scrollbar.new(this.root, {
      orientation: "horizontal"
    }));
  }

  createtimesiesData(currentData: any) {
    console.log('currentData', currentData);

    // Set data
    // เริ่มสร้างข้อมูลสำหรับกราฟ
    const chartData = currentData.map(({ date, unitTotal }: any) => ({
      date: new Date(date).getTime(), // แปลงให้เป็น timestamp
      unitTotal: parseFloat(unitTotal), // แปลงให้เป็นตัวเลข
      // unitPrice: parseFloat(unitPrice), // แปลงให้เป็นตัวเลข
      // fee: parseFloat(fee), // แปลงให้เป็นตัวเลข
      // bath: parseFloat(bath) // แปลงให้เป็นตัวเลข
    }));
    console.log(chartData);
    this.series.data.setAll(chartData);

    // Make stuff animate on load
    this.series.appear(1000);
    this.chart.appear(1000, 100);
  }
}
