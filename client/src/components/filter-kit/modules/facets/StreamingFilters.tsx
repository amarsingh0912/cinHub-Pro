import { useQuery } from "@tanstack/react-query";
import { AdvancedFilterState } from "@/types/filters";
import { FilterChip } from "../../atoms";
import { motion } from "framer-motion";
import { filterMotion } from "../../filter-motion";

interface StreamingFiltersProps {
  filters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
}

const MONETIZATION_TYPES = [
  { value: 'flatrate', label: 'Subscription' },
  { value: 'free', label: 'Free' },
  { value: 'ads', label: 'Free with Ads' },
  { value: 'rent', label: 'Rent' },
  { value: 'buy', label: 'Buy' },
];

export function StreamingFilters({ filters, onFiltersChange }: StreamingFiltersProps) {
  const { data: providers } = useQuery({
    queryKey: ['/api/watch-providers', filters.watch_region || 'US'],
  });

  const providerList = (providers as any)?.results || [];

  const toggleProvider = (providerId: number) => {
    const isSelected = filters.with_watch_providers.includes(providerId);
    onFiltersChange({
      ...filters,
      with_watch_providers: isSelected
        ? filters.with_watch_providers.filter(id => id !== providerId)
        : [...filters.with_watch_providers, providerId]
    });
  };

  const toggleMonetization = (type: string) => {
    const isSelected = filters.with_watch_monetization_types.includes(type as any);
    onFiltersChange({
      ...filters,
      with_watch_monetization_types: isSelected
        ? filters.with_watch_monetization_types.filter(t => t !== type)
        : [...filters.with_watch_monetization_types, type as any]
    });
  };

  return (
    <div className="space-y-6">
      {/* Monetization Types */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">Availability Type</h4>
        <motion.div
          className="flex flex-wrap gap-2"
          variants={filterMotion.staggerContainer}
          initial="initial"
          animate="animate"
        >
          {MONETIZATION_TYPES.map((type) => (
            <FilterChip
              key={type.value}
              label={type.label}
              selected={filters.with_watch_monetization_types.includes(type.value as any)}
              onToggle={() => toggleMonetization(type.value)}
              variant="success"
              size="md"
              data-testid={`monetization-${type.value}`}
            />
          ))}
        </motion.div>
      </div>

      {/* Streaming Providers */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">Streaming Services</h4>
        <motion.div
          className="grid grid-cols-2 gap-2"
          variants={filterMotion.staggerContainer}
          initial="initial"
          animate="animate"
        >
          {providerList.slice(0, 20).map((provider: any) => (
            <FilterChip
              key={provider.provider_id}
              label={provider.provider_name}
              selected={filters.with_watch_providers.includes(provider.provider_id)}
              onToggle={() => toggleProvider(provider.provider_id)}
              variant="primary"
              size="sm"
              data-testid={`provider-${provider.provider_id}`}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
