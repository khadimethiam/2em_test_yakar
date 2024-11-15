import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarsimpleComponent } from './sidebarsimple.component';

describe('SidebarsimpleComponent', () => {
  let component: SidebarsimpleComponent;
  let fixture: ComponentFixture<SidebarsimpleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarsimpleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebarsimpleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
