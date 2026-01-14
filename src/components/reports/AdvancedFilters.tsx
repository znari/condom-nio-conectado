import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CalendarIcon, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  RotateCcw 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  SERVICE_CATEGORIES, 
  CALL_STATUSES, 
  URGENCY_LEVELS,
  ServiceCategory,
  CallStatus,
  UrgencyLevel,
  ServiceProvider,
} from '@/types/database';

export interface FilterValues {
  startDate: Date;
  endDate: Date;
  categories: ServiceCategory[];
  statuses: CallStatus[];
  providers: string[];
  urgencies: UrgencyLevel[];
  minValue?: number;
  maxValue?: number;
}

interface AdvancedFiltersProps {
  filters: FilterValues;
  providers: ServiceProvider[];
  onFilterChange: (filters: FilterValues) => void;
}

export function AdvancedFilters({ filters, providers, onFilterChange }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterValues>(filters);

  const updateFilter = <K extends keyof FilterValues>(key: K, value: FilterValues[K]) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = <T extends string>(
    key: 'categories' | 'statuses' | 'providers' | 'urgencies',
    value: T
  ) => {
    setLocalFilters(prev => {
      const current = prev[key] as T[];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  const applyFilters = () => {
    onFilterChange(localFilters);
  };

  const resetFilters = () => {
    const defaultFilters: FilterValues = {
      startDate: filters.startDate,
      endDate: filters.endDate,
      categories: [],
      statuses: [],
      providers: [],
      urgencies: [],
      minValue: undefined,
      maxValue: undefined,
    };
    setLocalFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const activeFilterCount = 
    localFilters.categories.length + 
    localFilters.statuses.length + 
    localFilters.providers.length + 
    localFilters.urgencies.length +
    (localFilters.minValue !== undefined ? 1 : 0) +
    (localFilters.maxValue !== undefined ? 1 : 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardContent className="pt-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Filtros Avançados</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary">
                    {activeFilterCount} filtro{activeFilterCount !== 1 ? 's' : ''} ativo{activeFilterCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Quick date display */}
                <span className="text-sm text-muted-foreground">
                  {format(localFilters.startDate, 'dd/MM/yy')} - {format(localFilters.endDate, 'dd/MM/yy')}
                </span>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="border-t pt-4 space-y-6">
            {/* Date Range */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !localFilters.startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.startDate ? (
                        format(localFilters.startDate, 'PPP', { locale: ptBR })
                      ) : (
                        <span>Selecionar data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.startDate}
                      onSelect={(date) => date && updateFilter('startDate', date)}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !localFilters.endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.endDate ? (
                        format(localFilters.endDate, 'PPP', { locale: ptBR })
                      ) : (
                        <span>Selecionar data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.endDate}
                      onSelect={(date) => date && updateFilter('endDate', date)}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <Label>Categorias</Label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_CATEGORIES.map(cat => (
                  <Badge
                    key={cat.value}
                    variant={localFilters.categories.includes(cat.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayFilter('categories', cat.value)}
                  >
                    {cat.label}
                    {localFilters.categories.includes(cat.value) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-2">
                {CALL_STATUSES.map(status => (
                  <Badge
                    key={status.value}
                    variant={localFilters.statuses.includes(status.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayFilter('statuses', status.value)}
                  >
                    {status.label}
                    {localFilters.statuses.includes(status.value) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Urgency */}
            <div className="space-y-2">
              <Label>Urgência</Label>
              <div className="flex flex-wrap gap-2">
                {URGENCY_LEVELS.map(urgency => (
                  <Badge
                    key={urgency.value}
                    variant={localFilters.urgencies.includes(urgency.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayFilter('urgencies', urgency.value)}
                  >
                    {urgency.label}
                    {localFilters.urgencies.includes(urgency.value) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Providers */}
            {providers.length > 0 && (
              <div className="space-y-2">
                <Label>Prestadores</Label>
                <div className="flex flex-wrap gap-2">
                  {providers.map(provider => (
                    <Badge
                      key={provider.id}
                      variant={localFilters.providers.includes(provider.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleArrayFilter('providers', provider.id)}
                    >
                      {provider.name}
                      {localFilters.providers.includes(provider.id) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Value Range */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Valor Mínimo (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0,00"
                  value={localFilters.minValue ?? ''}
                  onChange={(e) => updateFilter('minValue', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Máximo (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="Sem limite"
                  value={localFilters.maxValue ?? ''}
                  onChange={(e) => updateFilter('maxValue', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
              <Button onClick={applyFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Aplicar Filtros
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
