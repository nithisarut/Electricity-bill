import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class CostService {

  private apiUrl = 'http://localhost:3002';


  constructor(private http: HttpClient) { }

  getCurrentCost(sd: string, ed: string, metertype: string, hometype: string): Observable<any> {
    const params = { sd, ed, metertype, hometype }; // สร้าง object ของ parameters ที่จะส่งไปยัง API
    return this.http.get<any>(this.apiUrl + '/getCurrentCost', { params });
  }

  getdataDayWeekMonth(): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/getdataDayWeekMonth');
  }
}