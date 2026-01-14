import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportPDFButtonProps {
  dashboardRef: React.RefObject<HTMLDivElement>;
  condominiumName: string;
  dateRange: { start: Date; end: Date };
}

export function ExportPDFButton({ dashboardRef, condominiumName, dateRange }: ExportPDFButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!dashboardRef.current) {
      toast.error('Erro ao gerar PDF');
      return;
    }

    setIsExporting(true);
    toast.info('Gerando relatório PDF...');

    try {
      const element = dashboardRef.current;
      
      // Capture the dashboard as canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(33, 33, 33);
      pdf.text('Relatório do Dashboard', margin, 20);

      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(condominiumName, margin, 28);

      pdf.setFontSize(10);
      const periodText = `Período: ${format(dateRange.start, "dd 'de' MMMM", { locale: ptBR })} a ${format(dateRange.end, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
      pdf.text(periodText, margin, 35);

      // Separator line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, 40, pageWidth - margin, 40);

      // Dashboard image
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let yPosition = 45;
      
      // Check if we need multiple pages
      if (imgHeight > pageHeight - 60) {
        // Scale down to fit
        const scaledHeight = pageHeight - 70;
        const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
        pdf.addImage(imgData, 'PNG', (pageWidth - scaledWidth) / 2, yPosition, scaledWidth, scaledHeight);
      } else {
        pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      const footerY = pageHeight - 10;
      pdf.text('Gerado por ZelaSync', margin, footerY);
      pdf.text(format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }), pageWidth - margin - 40, footerY);

      // Generate filename
      const slug = condominiumName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      const filename = `relatorio-${slug}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(filename);

      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar o relatório PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExportPDF}
      disabled={isExporting}
      className="gap-2"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="hidden sm:inline">Exportando...</span>
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar PDF</span>
        </>
      )}
    </Button>
  );
}
