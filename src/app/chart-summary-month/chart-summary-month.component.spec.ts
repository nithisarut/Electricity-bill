import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartSummaryMonthComponent } from './chart-summary-month.component';

describe('ChartSummaryMonthComponent', () => {
  let component: ChartSummaryMonthComponent;
  let fixture: ComponentFixture<ChartSummaryMonthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartSummaryMonthComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChartSummaryMonthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
