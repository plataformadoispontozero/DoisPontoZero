import { describe, it, expect } from 'vitest'
import { agendaRange } from './CalendarPage'

describe('Agenda period boundaries',()=>{
  it('uses the full leap-year February with an exclusive end',()=>{
    const {start,end}=agendaRange(new Date(2028,1,29,18),'month')
    expect([start.getFullYear(),start.getMonth(),start.getDate(),start.getHours()]).toEqual([2028,1,1,0])
    expect([end.getFullYear(),end.getMonth(),end.getDate()]).toEqual([2028,2,1])
  })
  it('starts the week on Monday even for a Sunday across year boundary',()=>{
    const {start,end}=agendaRange(new Date(2027,0,3),'week')
    expect([start.getFullYear(),start.getMonth(),start.getDate()]).toEqual([2026,11,28])
    expect([end.getFullYear(),end.getMonth(),end.getDate()]).toEqual([2027,0,4])
  })
  it('bounds a day without carrying over the selected hour',()=>{
    const {start,end}=agendaRange(new Date(2026,9,11,23,59),'day')
    expect(start.getHours()).toBe(0)
    expect(end.getDate()).toBe(12)
    expect(end.getHours()).toBe(0)
  })
})
