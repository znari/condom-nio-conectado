import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { ServiceCall, ServiceProvider, SERVICE_CATEGORY_LABELS, CALL_STATUS_LABELS, ServiceCategory, CallStatus } from '@/types/database';
import { FilterValues } from './AdvancedFilters';

interface ExportMultiFormatProps {
  calls: ServiceCall[];
  providers: ServiceProvider[];
  filters: FilterValues;
  condominiumName: string;
}

export function ExportMultiFormat({ calls, providers, filters, condominiumName }: ExportMultiFormatProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Relatório de Chamados', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(condominiumName, pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;
      
      pdf.setFontSize(10);
      pdf.text(
        `Período: ${format(filters.startDate, 'dd/MM/yyyy')} a ${format(filters.endDate, 'dd/MM/yyyy')}`,
        pageWidth / 2, yPos, { align: 'center' }
      );
      yPos += 15;

      // Summary
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Resumo Executivo', 14, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const completed = calls.filter(c => c.status === 'completed');
      const totalCost = completed.reduce((sum, c) => sum + (Number(c.actual_value) || 0), 0);
      const avgResolution = completed.length > 0
        ? completed.reduce((sum, c) => sum + (differenceInDays(new Date(c.updated_at), new Date(c.created_at)) || 1), 0) / completed.length
        : 0;

      const summaryData = [
        `• Total de chamados: ${calls.length}`,
        `• Chamados concluídos: ${completed.length}`,
        `• Taxa de conclusão: ${calls.length > 0 ? ((completed.length / calls.length) * 100).toFixed(0) : 0}%`,
        `• Custo total: R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `• Tempo médio de resolução: ${avgResolution.toFixed(1)} dias`,
      ];

      summaryData.forEach(line => {
        pdf.text(line, 14, yPos);
        yPos += 6;
      });
      yPos += 10;

      // Calls table
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Lista de Chamados', 14, yPos);
      yPos += 8;

      // Table headers
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      const headers = ['Título', 'Categoria', 'Status', 'Valor', 'Data'];
      const colWidths = [60, 35, 40, 25, 25];
      let xPos = 14;
      headers.forEach((header, i) => {
        pdf.text(header, xPos, yPos);
        xPos += colWidths[i];
      });
      yPos += 6;

      // Table rows
      pdf.setFont('helvetica', 'normal');
      calls.slice(0, 30).forEach(call => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }
        
        xPos = 14;
        const rowData = [
          call.title.substring(0, 30) + (call.title.length > 30 ? '...' : ''),
          SERVICE_CATEGORY_LABELS[call.category as ServiceCategory] || call.category,
          CALL_STATUS_LABELS[call.status as CallStatus] || call.status,
          `R$ ${(Number(call.actual_value) || Number(call.estimated_value) || 0).toLocaleString('pt-BR')}`,
          format(new Date(call.created_at), 'dd/MM/yy'),
        ];
        
        rowData.forEach((data, i) => {
          pdf.text(data.substring(0, 20), xPos, yPos);
          xPos += colWidths[i];
        });
        yPos += 5;
      });

      if (calls.length > 30) {
        yPos += 5;
        pdf.setFont('helvetica', 'italic');
        pdf.text(`... e mais ${calls.length - 30} chamados`, 14, yPos);
      }

      // Footer
      pdf.setFontSize(8);
      pdf.text(
        `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
        pageWidth / 2, 285, { align: 'center' }
      );

      pdf.save(`relatorio-chamados-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Relatório PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const exportExcel = async () => {
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // Calls sheet
      const callsData = calls.map(call => ({
        'ID': call.id,
        'Título': call.title,
        'Descrição': call.description,
        'Categoria': SERVICE_CATEGORY_LABELS[call.category as ServiceCategory] || call.category,
        'Status': CALL_STATUS_LABELS[call.status as CallStatus] || call.status,
        'Urgência': call.urgency,
        'Local': call.location,
        'Valor Orçado': Number(call.estimated_value) || 0,
        'Valor Real': Number(call.actual_value) || 0,
        'Prestador': call.provider?.name || 'Não atribuído',
        'Avaliação': call.rating || '',
        'Data Criação': format(new Date(call.created_at), 'dd/MM/yyyy HH:mm'),
        'Última Atualização': format(new Date(call.updated_at), 'dd/MM/yyyy HH:mm'),
      }));
      
      const wsCallls = XLSX.utils.json_to_sheet(callsData);
      XLSX.utils.book_append_sheet(wb, wsCallls, 'Chamados');

      // Summary sheet
      const completed = calls.filter(c => c.status === 'completed');
      const summaryData = [
        { 'Métrica': 'Total de Chamados', 'Valor': calls.length },
        { 'Métrica': 'Chamados Concluídos', 'Valor': completed.length },
        { 'Métrica': 'Taxa de Conclusão (%)', 'Valor': calls.length > 0 ? ((completed.length / calls.length) * 100).toFixed(1) : 0 },
        { 'Métrica': 'Custo Total (R$)', 'Valor': completed.reduce((sum, c) => sum + (Number(c.actual_value) || 0), 0) },
        { 'Métrica': 'Período', 'Valor': `${format(filters.startDate, 'dd/MM/yyyy')} a ${format(filters.endDate, 'dd/MM/yyyy')}` },
      ];
      
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

      // Providers sheet
      if (providers.length > 0) {
        const providersData = providers.map(p => ({
          'Nome': p.name,
          'Telefone/WhatsApp': p.phone_whatsapp,
          'Email': p.email || '',
          'Categorias': p.categories.map(c => SERVICE_CATEGORY_LABELS[c] || c).join(', '),
          'Avaliação Média': p.average_rating,
          'Total de Avaliações': p.total_ratings,
        }));
        
        const wsProviders = XLSX.utils.json_to_sheet(providersData);
        XLSX.utils.book_append_sheet(wb, wsProviders, 'Prestadores');
      }

      XLSX.writeFile(wb, `relatorio-chamados-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      toast.success('Relatório Excel exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast.error('Erro ao exportar Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const exportCSV = async () => {
    setIsExporting(true);
    try {
      const headers = [
        'ID', 'Título', 'Descrição', 'Categoria', 'Status', 'Urgência',
        'Local', 'Valor Orçado', 'Valor Real', 'Prestador', 'Avaliação',
        'Data Criação', 'Última Atualização'
      ];

      const rows = calls.map(call => [
        call.id,
        `"${call.title.replace(/"/g, '""')}"`,
        `"${call.description.replace(/"/g, '""')}"`,
        SERVICE_CATEGORY_LABELS[call.category as ServiceCategory] || call.category,
        CALL_STATUS_LABELS[call.status as CallStatus] || call.status,
        call.urgency,
        `"${call.location.replace(/"/g, '""')}"`,
        Number(call.estimated_value) || 0,
        Number(call.actual_value) || 0,
        call.provider?.name || 'Não atribuído',
        call.rating || '',
        format(new Date(call.created_at), 'dd/MM/yyyy HH:mm'),
        format(new Date(call.updated_at), 'dd/MM/yyyy HH:mm'),
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-chamados-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success('Relatório CSV exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const exportJSON = async () => {
    setIsExporting(true);
    try {
      const data = {
        metadata: {
          exportDate: new Date().toISOString(),
          condominium: condominiumName,
          period: {
            start: filters.startDate.toISOString(),
            end: filters.endDate.toISOString(),
          },
          filters: {
            categories: filters.categories,
            statuses: filters.statuses,
            urgencies: filters.urgencies,
            providers: filters.providers,
          },
        },
        summary: {
          totalCalls: calls.length,
          completedCalls: calls.filter(c => c.status === 'completed').length,
          totalCost: calls.filter(c => c.status === 'completed')
            .reduce((sum, c) => sum + (Number(c.actual_value) || 0), 0),
        },
        calls: calls.map(call => ({
          id: call.id,
          title: call.title,
          description: call.description,
          category: call.category,
          status: call.status,
          urgency: call.urgency,
          location: call.location,
          estimatedValue: Number(call.estimated_value) || null,
          actualValue: Number(call.actual_value) || null,
          rating: call.rating,
          ratingComment: call.rating_comment,
          provider: call.provider ? {
            id: call.provider.id,
            name: call.provider.name,
          } : null,
          createdAt: call.created_at,
          updatedAt: call.updated_at,
        })),
        providers: providers.map(p => ({
          id: p.id,
          name: p.name,
          phone: p.phone_whatsapp,
          email: p.email,
          categories: p.categories,
          averageRating: p.average_rating,
          totalRatings: p.total_ratings,
        })),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-chamados-${format(new Date(), 'yyyy-MM-dd')}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success('Relatório JSON exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar JSON:', error);
      toast.error('Erro ao exportar JSON');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar Excel
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportJSON}>
          <FileJson className="h-4 w-4 mr-2" />
          Exportar JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
