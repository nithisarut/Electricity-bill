import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeSeriesMonthComponent } from './time-series-month.component';

describe('TimeSeriesMonthComponent', () => {
  let component: TimeSeriesMonthComponent;
  let fixture: ComponentFixture<TimeSeriesMonthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeSeriesMonthComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TimeSeriesMonthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
