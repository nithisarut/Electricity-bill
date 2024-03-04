import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./navbar/navbar.component";
import { DashbordComponent } from "./dashbord/dashbord.component";
import { TimeSeriesMonthComponent } from "./time-series-month/time-series-month.component";
import { CommonModule } from '@angular/common';
import { initFlowbite } from 'flowbite';
import { HttpClientModule } from '@angular/common/http';
@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
    imports: [RouterOutlet, NavbarComponent, DashbordComponent,HttpClientModule,CommonModule, TimeSeriesMonthComponent]
})
export class AppComponent {
  title = 'ChartData';
  ngOnInit(): void {
    initFlowbite();
  }
}
