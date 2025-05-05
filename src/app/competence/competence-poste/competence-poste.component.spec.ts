import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompetencePosteComponent } from './competence-poste.component';

describe('CompetencePosteComponent', () => {
  let component: CompetencePosteComponent;
  let fixture: ComponentFixture<CompetencePosteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompetencePosteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompetencePosteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
  });
});
