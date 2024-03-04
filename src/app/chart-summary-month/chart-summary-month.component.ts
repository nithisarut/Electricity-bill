import { Component } from '@angular/core';
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5themes_Responsive from "@amcharts/amcharts5/themes/Responsive";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import { NgZone } from '@angular/core';
import { TimeSeriesMonthComponent } from "../time-series-month/time-series-month.component";

@Component({
  selector: 'app-chart-summary-month',
  standalone: true,
  imports: [],
  templateUrl: './chart-summary-month.component.html',
  styleUrl: './chart-summary-month.component.css'
})

export class ChartSummaryMonthComponent {
  constructor(private zone: NgZone) { }

  ngOnInit() {
    this.zone.runOutsideAngular(() => {
      window.requestAnimationFrame(() => {
        this.createChart();
      });
    });
  }
 
 

  createChart(){
    let root = am5.Root.new("chartdiv");

    const myTheme = am5.Theme.new(root);
    myTheme.rule("AxisLabel", ["minor"]).setAll({
      dy: 1
    });

    //8888888
    // Set themes
    root.setThemes([
      am5themes_Animated.new(root),
      myTheme,
      am5themes_Responsive.new(root)
    ]);

    // Create chart
    let chart = root.container.children.push(am5xy.XYChart.new(root, {
      panX: false,
      panY: false,
      wheelX: "panX",
      wheelY: "zoomX",
      paddingLeft: 0
    }));

    // Add cursor
    let cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
      behavior: "zoomX"
    }));
    cursor.lineY.set("visible", false);

    let date = new Date();
    date.setHours(0, 0, 0, 0);
    let value = 100;

    function generateData() {
      value = Math.round((Math.random() * 10 - 5) + value);
      am5.time.add(date, "day", 1);
      return {
        date: date.getTime(),
        value: value
      };
    }

    function generateDatas(count: any) {
      let data = [];
      for (var i = 0; i < count; ++i) {
        data.push(generateData());
      }
      return data;
    }

    // Create axes
    let xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
      maxDeviation: 0,
      baseInterval: {
        timeUnit: "month",
        count: 1
      },
      renderer: am5xy.AxisRendererX.new(root, {
        minorGridEnabled: true,
        minorLabelsEnabled: true
      }),
      tooltip: am5.Tooltip.new(root, {})
    }));

    xAxis.set("minorDateFormats", {
      "month": "MM"
    });

    let yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {})
    }));

    // Add series
    let series = chart.series.push(am5xy.ColumnSeries.new(root, {
      name: "Series",
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "value",
      valueXField: "date",
      tooltip: am5.Tooltip.new(root, {
        labelText: "{valueY}"
      })
    }));

    series.columns.template.setAll({ strokeOpacity: 0 });

    // Add scrollbar
    chart.set("scrollbarX", am5.Scrollbar.new(root, {
      orientation: "horizontal"
    }));

    let data = generateDatas(250);
    series.data.setAll(data);

    // Make stuff animate on load
    series.appear(1000);
    chart.appear(1000, 100);
  }

}
