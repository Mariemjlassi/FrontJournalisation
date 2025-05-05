import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CompetenceService } from '../service/competence.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-competence',
  imports: [CommonModule, ReactiveFormsModule,FormsModule, ButtonModule, DialogModule, InputTextModule, TableModule, ToastModule,ConfirmDialogModule],
  templateUrl: './competence.component.html',
  styleUrl: './competence.component.css',
  providers: [MessageService, ConfirmationService]
})
export class CompetencesComponent implements OnInit {
  globalFilter: string = '';
  @ViewChild('dt') dt: Table | undefined;
  competences: any[] = [];
  selectedCompetence: any = null;
  selectedCompetences: any[] = [];

  addDialogVisible = false;
  editDialogVisible = false;

  competenceForm = new FormGroup({
    nom: new FormControl('', [Validators.required, Validators.minLength(2)])
  });

  editCompetenceForm = new FormGroup({
    nom: new FormControl('', [Validators.required, Validators.minLength(2)])
  });

  constructor(
    private competenceService: CompetenceService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  applyFilter(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.globalFilter = input.value;
    if (this.dt) {
      this.dt.filterGlobal(this.globalFilter, 'contains');
    }
  }


  ngOnInit(): void {
    this.loadCompetences();
  }

  loadCompetences() {
    this.competenceService.getAll().subscribe({
      next: (data) => {
        this.competences = data;
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les compétences'
        });
      }
    });
  }

  showAddDialog() {
    this.competenceForm.reset();
    this.addDialogVisible = true;
  }

  showEditDialog(competence: any) {
    this.selectedCompetence = { ...competence };
    this.editCompetenceForm.patchValue({
      nom: competence.nom
    });
    this.editDialogVisible = true;
  }

  addCompetence() {
    if (this.competenceForm.invalid) {
      this.competenceForm.markAllAsTouched();
      return;
    }

    const nom = this.competenceForm.value.nom?.trim() || '';

    // Vérification de l'unicité
    const exists = this.competences.some(c => 
      c.nom.toLowerCase() === nom.toLowerCase()
    );
    
    if (exists) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Cette compétence existe déjà'
      });
      return;
    }

    this.competenceService.create({ nom }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Compétence ajoutée avec succès'
        });
        this.loadCompetences();
        this.addDialogVisible = false;
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err.error || 'Erreur lors de l\'ajout'
        });
      }
    });
  }

  updateCompetence() {
    if (this.editCompetenceForm.invalid) {
      this.editCompetenceForm.markAllAsTouched();
      return;
    }

    const nom = this.editCompetenceForm.value.nom?.trim() || '';

    // Vérification de l'unicité (en excluant la compétence actuelle)
    const exists = this.competences.some(c => 
      c.nom.toLowerCase() === nom.toLowerCase() && 
      c.id !== this.selectedCompetence.id
    );
    
    if (exists) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Cette compétence existe déjà'
      });
      return;
    }

    this.competenceService.update(this.selectedCompetence.id, { nom }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Compétence mise à jour avec succès'
        });
        this.loadCompetences();
        this.editDialogVisible = false;
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err.error || 'Erreur lors de la mise à jour'
        });
      }
    });
  }

  deleteCompetence(id: number) {
    this.competenceService.delete(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Compétence supprimée avec succès'
        });
        this.loadCompetences();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err.error || 'Erreur lors de la suppression'
        });
      }
    });
  }

  confirmDelete(id: number): void {
    this.confirmationService.confirm({
      message: 'Êtes-vous sûr de vouloir supprimer ce diplôme?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptIcon: 'pi pi-check',
      rejectIcon: 'pi pi-times',
      accept: () => {
        this.deleteCompetence(id);
      },
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Annulé',
          detail: 'Suppression annulée',
          life: 3000
        });
      }
    });
  }

  private convertCompetencesToCSV(competences: any[]): string {
    const headers = ['Référence', 'Nom de la Compétence'];
    const rows = competences.map(competence => [
        `COMP-${competence.id}`,
        competence.nom
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private downloadCSV(csvData: string, fileName: string): void {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportCompetences(): void {
    if (this.selectedCompetences.length > 0) {
      this.confirmationService.confirm({
        message: `Voulez-vous exporter les ${this.selectedCompetences.length} compétences sélectionnées ?`,
        header: 'Confirmation export',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Oui',
        rejectLabel: 'Non',
        acceptButtonStyleClass: 'p-button-danger',
        rejectButtonStyleClass: 'p-button-secondary',
        acceptIcon: 'pi pi-check',
        rejectIcon: 'pi pi-times',
        accept: () => {
          const csvData = this.convertCompetencesToCSV(this.selectedCompetences);
          this.downloadCSV(csvData, 'competences_selectionnees');
          this.messageService.add({
            severity: 'success',
            summary: 'Export réussi',
            detail: `${this.selectedCompetences.length} compétences exportées`
          });
        }
      });
    } else {
      this.confirmationService.confirm({
        message: 'Aucune compétence sélectionnée. Voulez-vous exporter toutes les compétences ?',
        header: 'Confirmation export',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Oui',
        rejectLabel: 'Non',
        acceptButtonStyleClass: 'p-button-danger',
        rejectButtonStyleClass: 'p-button-secondary',
        acceptIcon: 'pi pi-check',
        rejectIcon: 'pi pi-times',
        accept: () => {
          const csvData = this.convertCompetencesToCSV(this.competences);
          this.downloadCSV(csvData, 'competences');
          this.messageService.add({
            severity: 'success',
            summary: 'Export réussi',
            detail: `${this.competences.length} compétences exportées`
          });
        }
      });
    }
  }
  
}