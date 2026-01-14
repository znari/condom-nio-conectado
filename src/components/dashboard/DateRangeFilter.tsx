import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format, subMonths, subYears, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DateRangeFilterProps {
  startDate: Date;
  endDate: Date;
  onRangeChange: (start: Date, end: Date) => void;
}

type PresetKey = 'last-month' | 'last-3-months' | 'last-6-months' | 'this-year' | 'last-year' | 'custom';

const presets: { key: PresetKey; label: string }[] = [
  { key: 'last-month', label: 'Último mês' },
  { key: 'last-3-months', label: 'Últimos 3 meses' },
  { key: 'last-6-months', label: 'Últimos 6 meses' },
  { key: 'this-year', label: 'Este ano' },
  { key: 'last-year', label: 'Ano anterior' },
  { key: 'custom', label: 'Personalizado' },
];

function getPresetDates(preset: PresetKey): { start: Date; end: Date } {
  const now = new Date();
  
  switch (preset) {
    case 'last-month':
      return {
        start: startOfMonth(subMonths(now, 1)),
        end: endOfMonth(subMonths(now, 1)),
      };
    case 'last-3-months':
      return {
        start: startOfMonth(subMonths(now, 2)),
        end: endOfMonth(now),
      };
    case 'last-6-months':
      return {
        start: startOfMonth(subMonths(now, 5)),
        end: endOfMonth(now),
      };
    case 'this-year':
      return {
        start: startOfYear(now),
        end: endOfYear(now),
      };
    case 'last-year':
      return {
        start: startOfYear(subYears(now, 1)),
        end: endOfYear(subYears(now, 1)),
      };
    default:
      return {
        start: startOfMonth(subMonths(now, 5)),
        end: endOfMonth(now),
      };
  }
}

export function DateRangeFilter({ startDate, endDate, onRangeChange }: DateRangeFilterProps) {
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>('last-6-months');
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [tempStart, setTempStart] = useState<Date | undefined>(startDate);
  const [tempEnd, setTempEnd] = useState<Date | undefined>(endDate);

  const handlePresetChange = (preset: PresetKey) => {
    setSelectedPreset(preset);
    if (preset === 'custom') {
      setIsCustomOpen(true);
    } else {
      const { start, end } = getPresetDates(preset);
      onRangeChange(start, end);
    }
  };

  const handleApplyCustomRange = () => {
    if (tempStart && tempEnd) {
      onRangeChange(tempStart, tempEnd);
      setIsCustomOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={selectedPreset} onValueChange={(value) => handlePresetChange(value as PresetKey)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset.key} value={preset.key}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedPreset === 'custom' && (
        <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn('justify-start text-left font-normal')}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(startDate, 'dd/MM/yyyy', { locale: ptBR })} - {format(endDate, 'dd/MM/yyyy', { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-2 text-sm font-medium">Data inicial</p>
                  <Calendar
                    mode="single"
                    selected={tempStart}
                    onSelect={setTempStart}
                    disabled={(date) => (tempEnd ? date > tempEnd : false)}
                    locale={ptBR}
                    initialFocus
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">Data final</p>
                  <Calendar
                    mode="single"
                    selected={tempEnd}
                    onSelect={setTempEnd}
                    disabled={(date) => (tempStart ? date < tempStart : false)}
                    locale={ptBR}
                  />
                </div>
              </div>
              <Button onClick={handleApplyCustomRange} disabled={!tempStart || !tempEnd}>
                Aplicar
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <span className="text-sm text-muted-foreground">
        {format(startDate, "dd 'de' MMM", { locale: ptBR })} - {format(endDate, "dd 'de' MMM, yyyy", { locale: ptBR })}
      </span>
    </div>
  );
}
