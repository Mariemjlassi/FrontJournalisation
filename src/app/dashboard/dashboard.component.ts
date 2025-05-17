import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { JournalActionService } from '../utilisateur/service/journal-action.service';
import { UtilisateurService } from '../utilisateur/service/utilisateur.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { CalendarModule } from 'primeng/calendar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { MenuModule } from 'primeng/menu';
import { TabMenuModule } from 'primeng/tabmenu';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { CardModule } from 'primeng/card';
import { ListboxModule } from 'primeng/listbox';
import { TimelineModule } from 'primeng/timeline';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    ButtonModule,
    DatePickerModule,
    TableModule,
    CalendarModule,
    FormsModule,
    ReactiveFormsModule,
    DropdownModule,
    DialogModule,
    MenuModule,
    TabMenuModule,
    ToolbarModule,
    ButtonGroupModule,
    CardModule,
    ListboxModule,
    TimelineModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  activityTypeOptions: any[] = [];
  selectedTypeFilter: any = null;
  activities: any[] = [];
  users: any[] = [];
  recentActivities: any[] = [];
  chart: any;
  selectedFilter: 'week' | 'month' | 'year' = 'week';
  timeLabel = 'la semaine';
  timeChart: any;
  showAllActivities = false;
  displayedColumns: string[] = ['action', 'utilisateur', 'description', 'date'];
  filteredActivities: any[] = [];
  activityTypes: string[] = [];
  selectedDateFilter: Date | null = null;
  displayActivitiesDialog: boolean = false;
  chartType: 'line' | 'bar' = 'line';
  timeRangeItems: any[] = [];
  activeTimeRange: any;
  failedAttempts: any[] = [];
  alertLevels = {
    warning: 'warning',
    danger: 'danger'
  };

  stats = {
    totalUsers: 0,
    lockedAccounts: 0,
    totalActions: 0,
    lastWeekActions: 0,
  };

  constructor(
    private journalService: JournalActionService,
    private userService: UtilisateurService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.initTimeRangeMenu();
  }

  initTimeRangeMenu() {
  this.timeRangeItems = [
    { label: 'Hebdomadaire', icon: 'pi pi-calendar', command: () => this.setTimeFilter('week') },
    { label: 'Mensuel', icon: 'pi pi-calendar', command: () => this.setTimeFilter('month') },
    { label: 'Annuel', icon: 'pi pi-calendar', command: () => this.setTimeFilter('year') }
  ];
  this.activeTimeRange = this.timeRangeItems[0];
}

setChartType(type: 'line' | 'bar') {
  this.chartType = type;
  this.initTimeChart();
}

getLegendItems() {
  return [
    { label: 'Activités', color: 'rgb(163, 27, 57)' }
  ];
}

  loadData() {
  this.journalService.getAllJournalActions().subscribe(actions => {
    this.activities = actions;
    this.recentActivities = actions.slice(0, 11);
    this.stats.totalActions = actions.length;
    this.stats.lastWeekActions = this.getLastWeekActions(actions);
    this.activityTypes = [...new Set(actions.map(a => a.action))];

    this.failedAttempts = actions
      .filter(a => a.action === 'TENTATIVE_CONNEXION_ECHOUEE')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    this.activityTypeOptions = [
      { label: 'Tous les types', value: null },
      ...this.activityTypes.map(type => ({ label: type, value: type }))
    ];

    // Attendre que la vue soit mise à jour avant d'initialiser les graphiques
    setTimeout(() => this.initCharts(), 0);
  });

  this.userService.getAllUsers().subscribe(users => {
    this.users = users;
    this.stats.totalUsers = users.length;
    this.stats.lockedAccounts = users.filter(u => u.accountLocked).length;
  });
}

  toggleAllActivities() {
    this.displayActivitiesDialog = !this.displayActivitiesDialog;
    if (this.displayActivitiesDialog) {
      this.resetFilters();
    }
  }

  filterByDate(event: any) {
    this.selectedDateFilter = event.value;
    this.applyFilters();
  }
  filterByType(type: string) {
    this.selectedTypeFilter = type;
    this.applyFilters();
  }

  getPrimeNgActivityIcon(action: string): string {
    switch (action.toLowerCase()) {
      case 'Login':
        return 'pi pi-sign-in';
      default:
        return 'pi pi-info-circle';
    }
  }

  getAlertLevel(attempt: any): string {
  // Extraire le nombre de tentatives de la description
  const attemptMatch = attempt.description.match(/Tentative (\d+)/);
  const attempts = attemptMatch ? parseInt(attemptMatch[1], 10) : 0;
  
  // Vérifier si le compte est verrouillé
  const isLocked = attempt.description.toLowerCase().includes('verrouillé');

  if (isLocked || attempts >= 3) {
    return this.alertLevels.danger;
  }
  return this.alertLevels.warning;
}

getAlertStatus(attempt: any): string {
  const level = this.getAlertLevel(attempt);
  return level === this.alertLevels.danger ? 'Compte bloqué' : 'Avertissement';
}
getAttemptCount(attempt: any): number {
  const attemptMatch = attempt.description.match(/Tentative (\d+)/);
  return attemptMatch ? parseInt(attemptMatch[1], 10) : 0;
}

getAlertIcon(attempt: any): string {
  if (attempt.description.includes('verrouillé')) {
    return 'pi pi-lock';
  }
  return 'pi pi-exclamation-triangle';
}

  applyFilters() {
    let filtered = [...this.activities];

    // Filtre par date
    if (this.selectedDateFilter) {
      filtered = filtered.filter((activity) => {
        const activityDate = new Date(activity.timestamp);
        return (
          activityDate.toDateString() ===
          this.selectedDateFilter?.toDateString()
        );
      });
    }

    // Filtre par type
    if (this.selectedTypeFilter && this.selectedTypeFilter !== 'all') {
      filtered = filtered.filter(
        (activity) => activity.action === this.selectedTypeFilter
      );
    }

    this.filteredActivities = filtered;
  }

  resetFilters() {
    this.selectedDateFilter = null;
    this.selectedTypeFilter = null;
    this.filteredActivities = [...this.activities];
    this.applyFilters();
  }
  private getLastWeekActions(actions: any[]): number {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return actions.filter((a) => new Date(a.timestamp) > oneWeekAgo).length;
  }

  // Mettez à jour votre fichier TS pour les couleurs des graphiques
  private initCharts() {
  // Détruire les anciens graphiques proprement
  this.destroyCharts();

  // Attendre que la vue soit mise à jour
  setTimeout(() => {
    this.createActionChart();
    this.createRoleChart();
    this.initTimeChart();
  }, 0);
}

private destroyCharts() {
  if (this.chart) {
    this.chart.destroy();
    this.chart = null;
  }
  if (this.timeChart) {
    this.timeChart.destroy();
    this.timeChart = null;
  }
}

private createActionChart() {
  const ctx = document.getElementById('actionChart') as HTMLCanvasElement;
  if (!ctx) return;

  const actionCounts = this.activities.reduce((acc, curr) => {
    acc[curr.action] = (acc[curr.action] || 0) + 1;
    return acc;
  }, {});

  this.chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(actionCounts),
      datasets: [{
        label: 'Nombre d\'actions',
        data: Object.values(actionCounts),
        backgroundColor: 'rgba(255, 121, 121, 0.14)',
        borderColor: 'rgb(201, 22, 22)',
        borderWidth: 2,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(255, 121, 121, 0.29)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Statistiques des Actions',
          color: '#2B3467',
          font: { size: 16 }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#2B3467' } },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { color: '#2B3467' }
        }
      }
    }
  });
}

private createRoleChart() {
  const ctx = document.getElementById('roleChart') as HTMLCanvasElement;
  if (!ctx) return;

  const roleCounts = this.users.reduce((acc, curr) => {
    acc[curr.role] = (acc[curr.role] || 0) + 1;
    return acc;
  }, {});

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(roleCounts),
      datasets: [{
        label: 'Répartition des rôles',
        data: Object.values(roleCounts),
        backgroundColor: ['#133E87', '#608BC1', '#88C273', '#180161', '#180161'],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#2B3467', font: { size: 12 } }
        },
        title: {
          display: true,
          text: 'Répartition des Rôles',
          color: '#2B3467',
          font: { size: 16 }
        }
      },
      cutout: '70%'
    }
  });
}
  private initTimeChart() {
  const ctx = document.getElementById('timeChart') as HTMLCanvasElement;
  if (this.timeChart) {
    this.timeChart.destroy();
  }

  const { labels, data } = this.prepareTimeData();
  
  const chartConfig: any = {
    type: this.chartType,
    data: {
      labels: labels,
      datasets: [{
        label: 'Nombre d\'actions',
        data: data,
        borderColor: 'rgb(27, 163, 75)',
        backgroundColor: this.chartType === 'bar' ? 'rgba(185, 255, 195, 0.22)' : 'rgba(223, 255, 224, 0.35)',
        borderWidth: 2,
        tension: 0.4,
        fill: this.chartType === 'line'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: false,
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 6
        }
      },
      scales: {
        x: {
          grid: { 
            display: false,
            color: 'rgba(0,0,0,0.05)'
          },
          title: {
            display: true,
            text: this.getTimeAxisLabel(),
            font: { weight: 'bold' }
          },
          ticks: {
            font: { size: 12 }
          }
        },
        y: {
          beginAtZero: true,
          grid: { 
            color: 'rgba(0,0,0,0.05)'
          },
          title: {
            display: true,
            text: 'Nombre d\'actions',
            font: { weight: 'bold' }
          },
          ticks: {
            font: { size: 12 }
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuad'
      }
    }
  };

  if (this.chartType === 'bar') {
    chartConfig.options.barPercentage = 0.6;
    chartConfig.options.categoryPercentage = 0.8;
  }

  this.timeChart = new Chart(ctx, chartConfig);
}

  private prepareTimeData() {
    const now = new Date();
    const dataMap = new Map<string, number>();

    this.activities.forEach((activity) => {
      const date = new Date(activity.timestamp);
      const key = this.getTimeKey(date);
      dataMap.set(key, (dataMap.get(key) || 0) + 1);
    });

    const labels = Array.from(dataMap.keys()).sort();
    const data = labels.map((label) => dataMap.get(label) || 0);

    return { labels, data };
  }

  private getTimeKey(date: Date): string {
    switch (this.selectedFilter) {
      case 'week':
        return `S${this.getWeekNumber(date)} ${date.getFullYear()}`;
      case 'month':
        return date.toLocaleString('default', { month: 'long' });
      case 'year':
        return date.getFullYear().toString();
      default:
        return '';
    }
  }

  private getWeekNumber(d: Date) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(
      ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    );
  }

  private getTimeAxisLabel() {
    switch (this.selectedFilter) {
      case 'week':
        return 'Semaines';
      case 'month':
        return 'Mois';
      case 'year':
        return 'Années';
      default:
        return '';
    }
  }

  setTimeFilter(filter: 'week' | 'month' | 'year') {
    this.selectedFilter = filter;
    this.timeLabel = this.getTimeLabel();
    this.initTimeChart();
  }

  private getTimeLabel() {
    switch (this.selectedFilter) {
      case 'week':
        return 'la semaine';
      case 'month':
        return 'le mois';
      case 'year':
        return "l'année";
      default:
        return '';
    }
  }
  getActivityIcon(action: string): string {
    switch (action.toLowerCase()) {
      case 'connexion':
        return 'login';
      case 'création':
        return 'add_circle';
      case 'modification':
        return 'edit';
      case 'suppression':
        return 'delete';
      default:
        return 'notifications';
    }
  }

  getActivityIconClass(action: string): string {
    switch (action.toLowerCase()) {
      case 'connexion':
        return 'login-activity';
      case 'création':
        return 'create-activity';
      case 'modification':
        return 'update-activity';
      case 'suppression':
        return 'delete-activity';
      default:
        return 'other-activity';
    }
  }
}
