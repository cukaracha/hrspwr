import * as React from 'react';
import { ModalBackdrop } from './ModalBackdrop';
import { CloseButton } from '../buttons/closebutton/CloseButton';
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from '../cards/glasscard/GlassCard';
import { CollapsibleCard } from '../cards/collapsiblecard/CollapsibleCard';
import { Vehicle } from '../cards/vehiclecard/VehicleCard';

export interface VehicleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
}

export const VehicleDetailsModal: React.FC<VehicleDetailsModalProps> = ({
  isOpen,
  onClose,
  vehicle,
}) => {
  if (!vehicle) return null;

  const apiData = vehicle.apiData;

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <GlassCard
        variant='default'
        className='cursor-default hover:bg-white/10 hover:shadow-2xl active:scale-100 max-h-[90vh] overflow-y-auto w-full max-w-4xl'
      >
        {/* Header */}
        <GlassCardHeader className='relative'>
          <GlassCardTitle className='text-3xl'>Vehicle Information</GlassCardTitle>
          <CloseButton onClick={onClose} />
        </GlassCardHeader>

        {/* Content */}
        <GlassCardContent className='space-y-4'>
          {/* Primary Information Card */}
          <GlassCard
            variant='default'
            className='cursor-default hover:bg-white/10 hover:shadow-2xl active:scale-100'
          >
            <GlassCardHeader>
              <GlassCardTitle className='text-2xl'>Primary Information</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <InfoItem label='VIN' value={vehicle.vin || apiData?.vin} />
                <InfoItem label='Year' value={vehicle.year || apiData?.model_year} />
                <InfoItem label='Make' value={vehicle.make || apiData?.make} />
                <InfoItem label='Model' value={vehicle.model || apiData?.model} />
                <InfoItem label='Trim' value={vehicle.trim || apiData?.trim} />
                <InfoItem label='Series' value={apiData?.series} />
                <InfoItem label='Body Class' value={apiData?.body_class} />
                <InfoItem label='Vehicle Type' value={apiData?.vehicle_type} />
                <InfoItem label='Manufacturer' value={apiData?.manufacturer_name} />
                <InfoItem
                  label='Plant Location'
                  value={
                    apiData?.plant_city && apiData?.plant_country
                      ? `${apiData.plant_city}, ${apiData.plant_country}`
                      : apiData?.plant_city || apiData?.plant_country
                  }
                />
                <InfoItem label='Drive Type' value={apiData?.drive_type} />
                <InfoItem
                  label='Engine'
                  value={
                    apiData?.engine_number_of_cylinders
                      ? `${apiData.engine_number_of_cylinders} Cylinders`
                      : undefined
                  }
                />
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Additional Details - Collapsible */}
          {apiData && (
            <CollapsibleCard title='Additional Details' defaultOpen={false}>
              <div className='space-y-6'>
                {/* Specifications */}
                <DetailSection
                  title='Specifications'
                  items={[
                    { label: 'Doors', value: apiData.doors },
                    { label: 'Seats', value: apiData.number_of_seats },
                    { label: 'Seat Rows', value: apiData.number_of_seat_rows },
                    {
                      label: 'Wheelbase',
                      value: apiData['wheel_base_(inches)_from']
                        ? `${apiData['wheel_base_(inches)_from']}"`
                        : undefined,
                    },
                    { label: 'Number of Wheels', value: apiData.number_of_wheels },
                    {
                      label: 'Front Wheel Size',
                      value: apiData['wheel_size_front_(inches)']
                        ? `${apiData['wheel_size_front_(inches)']}"`
                        : undefined,
                    },
                    {
                      label: 'Rear Wheel Size',
                      value: apiData['wheel_size_rear_(inches)']
                        ? `${apiData['wheel_size_rear_(inches)']}"`
                        : undefined,
                    },
                    { label: 'Axles', value: apiData.axles },
                    {
                      label: 'Steering Location',
                      value: apiData.steering_location,
                    },
                  ]}
                />

                {/* Engine & Performance */}
                <DetailSection
                  title='Engine & Performance'
                  items={[
                    {
                      label: 'Cylinders',
                      value: apiData.engine_number_of_cylinders,
                    },
                    {
                      label: 'Displacement (L)',
                      value: apiData['displacement_(l)'],
                    },
                    {
                      label: 'Displacement (cc)',
                      value: apiData['displacement_(cc)'],
                    },
                    {
                      label: 'Displacement (ci)',
                      value: apiData['displacement_(ci)'],
                    },
                    { label: 'Fuel Type', value: apiData['fuel_type_-_primary'] },
                    {
                      label: 'Horsepower',
                      value: apiData['engine_brake_(hp)_from']
                        ? `${apiData['engine_brake_(hp)_from']} HP`
                        : undefined,
                    },
                    {
                      label: 'Top Speed',
                      value: apiData['top_speed_(mph)']
                        ? `${apiData['top_speed_(mph)']} mph`
                        : undefined,
                    },
                  ]}
                />

                {/* Transmission */}
                <DetailSection
                  title='Transmission'
                  items={[
                    {
                      label: 'Transmission Style',
                      value: apiData.transmission_style,
                    },
                    {
                      label: 'Transmission Speeds',
                      value: apiData.transmission_speeds
                        ? `${apiData.transmission_speeds}-Speed`
                        : undefined,
                    },
                  ]}
                />

                {/* Safety Features */}
                <DetailSection
                  title='Safety Features'
                  items={[
                    {
                      label: 'ABS',
                      value: apiData['anti-lock_braking_system_(abs)'],
                    },
                    {
                      label: 'ESC',
                      value: apiData['electronic_stability_control_(esc)'],
                    },
                    { label: 'Traction Control', value: apiData.traction_control },
                    {
                      label: 'TPMS Type',
                      value: apiData['tire_pressure_monitoring_system_(tpms)_type'],
                    },
                    { label: 'Seat Belt Type', value: apiData.seat_belt_type },
                    { label: 'Pretensioner', value: apiData.pretensioner },
                    {
                      label: 'Front Airbags',
                      value: apiData.front_air_bag_locations,
                    },
                    {
                      label: 'Side Airbags',
                      value: apiData.side_air_bag_locations,
                    },
                    {
                      label: 'Curtain Airbags',
                      value: apiData.curtain_air_bag_locations,
                    },
                    {
                      label: 'Knee Airbags',
                      value: apiData.knee_air_bag_locations,
                    },
                  ]}
                />

                {/* Driver Assistance */}
                <DetailSection
                  title='Driver Assistance'
                  items={[
                    {
                      label: 'Adaptive Cruise Control',
                      value: apiData['adaptive_cruise_control_(acc)'],
                    },
                    {
                      label: 'Forward Collision Warning',
                      value: apiData['forward_collision_warning_(fcw)'],
                    },
                    {
                      label: 'Crash Imminent Braking',
                      value: apiData['crash_imminent_braking_(cib)'],
                    },
                    {
                      label: 'Dynamic Brake Support',
                      value: apiData['dynamic_brake_support_(dbs)'],
                    },
                    {
                      label: 'Blind Spot Warning',
                      value: apiData['blind_spot_warning_(bsw)'],
                    },
                    {
                      label: 'Lane Departure Warning',
                      value: apiData['lane_departure_warning_(ldw)'],
                    },
                    {
                      label: 'Lane Keeping Assistance',
                      value: apiData['lane_keeping_assistance_(lka)'],
                    },
                    { label: 'Backup Camera', value: apiData.backup_camera },
                    { label: 'Parking Assist', value: apiData.parking_assist },
                  ]}
                />

                {/* Convenience Features */}
                <DetailSection
                  title='Convenience Features'
                  items={[
                    { label: 'Keyless Ignition', value: apiData.keyless_ignition },
                    {
                      label: 'Auto-Reverse Windows/Sunroof',
                      value: apiData['auto-reverse_system_for_windows_and_sunroofs'],
                    },
                    {
                      label: 'Daytime Running Lights',
                      value: apiData['daytime_running_light_(drl)'],
                    },
                    {
                      label: 'Automatic High Beams',
                      value: apiData.semiautomatic_headlamp_beam_switching,
                    },
                    {
                      label: 'Adaptive Driving Beam',
                      value: apiData['adaptive_driving_beam_(adb)'],
                    },
                    {
                      label: 'Automatic Crash Notification',
                      value:
                        apiData[
                          'automatic_crash_notification_(acn)_/_advanced_automatic_crash_notification_(aacn)'
                        ],
                    },
                  ]}
                />

                {/* Other Information */}
                <DetailSection
                  title='Other Information'
                  items={[
                    {
                      label: 'Base Price',
                      value: apiData['base_price_($)']
                        ? `$${parseFloat(apiData['base_price_($)']).toLocaleString()}`
                        : undefined,
                    },
                    {
                      label: 'Vehicle Descriptor',
                      value: apiData.vehicle_descriptor,
                    },
                    { label: 'Error/Status', value: apiData.error_text },
                  ]}
                />
              </div>
            </CollapsibleCard>
          )}
        </GlassCardContent>
      </GlassCard>
    </ModalBackdrop>
  );
};

// Helper component for displaying individual info items
function InfoItem({ label, value }: { label: string; value?: string }) {
  if (!value || value === 'Not Applicable') return null;

  return (
    <div className='space-y-1'>
      <p className='text-sm font-medium text-glass-text/60'>{label}</p>
      <p className='text-base font-semibold text-glass-text'>{value}</p>
    </div>
  );
}

// Helper component for detail sections
function DetailSection({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value?: string }>;
}) {
  const visibleItems = items.filter(item => item.value && item.value !== 'Not Applicable');

  if (visibleItems.length === 0) return null;

  return (
    <div className='space-y-3'>
      <h4 className='text-lg font-bold text-glass-text border-b border-glass-border pb-2'>
        {title}
      </h4>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {visibleItems.map(item => (
          <InfoItem key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
    </div>
  );
}
