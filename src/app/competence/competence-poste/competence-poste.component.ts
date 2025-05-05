import { Component, OnInit, ViewChild } from '@angular/core';
import { CompetencePoste } from '../../poste/model/competenceposte';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompetencePosteService } from '../../poste/service/competenceposte.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-competence-poste',
  imports: [CommonModule, TableModule, ButtonModule, DialogModule, FormsModule, ReactiveFormsModule, ConfirmDialogModule, ToastModule, InputTextModule,TextareaModule],
  templateUrl: './competence-poste.component.html',
  styleUrl: './competence-poste.component.css',
  providers:[MessageService, ConfirmationService]
})
export class CompetencePosteComponent implements OnInit{
  competences: CompetencePoste[] = [];
  selectedCompetence: CompetencePoste | null = null;
  selectedCompetences: CompetencePoste[] = [];
  addDialogVisible = false;
  editDialogVisible = false;

  // Ajoutez en haut avec les autres propriétés
globalFilter: string = '';
@ViewChild('dt') dt: Table | undefined;

// Ajoutez cette méthode pour le filtrage
applyFilter(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.globalFilter = input.value;
    if (this.dt) {
        this.dt.filterGlobal(this.globalFilter, 'contains');
    }
}

  competenceForm = new FormGroup({
    nom: new FormControl('', [Validators.required, Validators.minLength(2)]),
    description: new FormControl('')
  });

  editCompetenceForm = new FormGroup({
    nom: new FormControl('', [Validators.required, Validators.minLength(2)]),
    description: new FormControl('')
  });

  constructor(
    private competencePosteService: CompetencePosteService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadCompetences();
  }

  loadCompetences(): void {
    this.competencePosteService.getAllCompetences().subscribe({
      next: (data) => {
        this.competences = data;
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les compétences poste'
        });
      }
    });
  }

  showAddDialog(): void {
    this.competenceForm.reset();
    this.addDialogVisible = true;
  }

  showEditDialog(competence: CompetencePoste): void {
    this.selectedCompetence = { ...competence };
    this.editCompetenceForm.patchValue({
      nom: competence.nom,
      description: competence.description
    });
    this.editDialogVisible = true;
  }

  addCompetence(): void {
    if (this.competenceForm.invalid) {
      this.competenceForm.markAllAsTouched();
      return;
    }

    const formValue = this.competenceForm.value;
    const nom = formValue.nom?.trim() || '';
    const description = formValue.description?.trim() || '';

    // Vérification de l'unicité
    const exists = this.competences.some(c => 
      c.nom.toLowerCase() === nom.toLowerCase()
    );
    
    if (exists) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Cette compétence poste existe déjà'
      });
      return;
    }

    this.competencePosteService.create({ nom, description }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Compétence poste ajoutée avec succès'
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

  updateCompetence(): void {
    if (this.editCompetenceForm.invalid || !this.selectedCompetence?.id) {
      this.editCompetenceForm.markAllAsTouched();
      return;
    }

    const formValue = this.editCompetenceForm.value;
    const nom = formValue.nom?.trim() || '';
    const description = formValue.description?.trim() || '';

    // Vérification de l'unicité (en excluant la compétence actuelle)
    const exists = this.competences.some(c => 
      c.nom.toLowerCase() === nom.toLowerCase() && 
      c.id !== this.selectedCompetence?.id
    );
    
    if (exists) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Cette compétence poste existe déjà'
      });
      return;
    }

    this.competencePosteService.update(this.selectedCompetence.id, { nom, description }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Compétence poste mise à jour avec succès'
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

  deleteCompetence(id: number): void {
    this.competencePosteService.delete(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Compétence poste supprimée avec succès'
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
      message: 'Êtes-vous sûr de vouloir supprimer cette compétence poste?',
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

  private convertCompetencesToCSV(competences: CompetencePoste[]): string {
    const headers = ['Référence', 'Nom', 'Description'];
    const rows = competences.map(competence => [
        `COMP-${competence.id}`,
        competence.nom,
        competence.description || 'Non spécifié'
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
    // Vérifier si des compétences sont sélectionnées
    if (this.selectedCompetences.length > 0) {
        // Confirmation avant export des sélections
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
        // Si aucune compétence sélectionnée, exporter tout avec confirmation
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
