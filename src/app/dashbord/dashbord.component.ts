import { Component } from '@angular/core';
// import { HttpClientModule } from '@angular/common/http'
import { TimeSeriesMonthComponent } from "../time-series-month/time-series-month.component";
import { ChartSummaryMonthComponent } from "../chart-summary-month/chart-summary-month.component";
import { CostService } from '../cost.service';


@Component({
    selector: 'app-dashbord',
    standalone: true,
    templateUrl: './dashbord.component.html',
    styleUrl: './dashbord.component.css',
    imports: [TimeSeriesMonthComponent, ChartSummaryMonthComponent, ],
    providers:[CostService]
})
export class DashbordComponent {
  currentCostData: any;

  constructor(private costService: CostService) { }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData() {
    this.costService.getCurrentCost('', '', '', 'TOU') // ส่งพารามิเตอร์ตามที่ต้องการ ในที่นี้ใช้ค่าว่างไว้
      .subscribe(
        (data) => {
          this.currentCostData = data[0];
          console.log(this.currentCostData)
        },
        (error) => {
          console.error('Error fetching data:', error);
        }
    
      );
  }
}