import { VinLookupResponse } from '../../services/agentsApi';

export interface DataField {
  label: string;
  value?: string;
}

export function getPrimaryInfoFields(
  apiData?: VinLookupResponse,
  vehicle?: { vin?: string; year?: string; make?: string; model?: string; trim?: string }
): DataField[] {
  return [
    { label: 'VIN', value: vehicle?.vin || apiData?.vin },
    { label: 'Year', value: vehicle?.year || apiData?.model_year },
    { label: 'Make', value: vehicle?.make || apiData?.make },
    { label: 'Model', value: vehicle?.model || apiData?.model },
    { label: 'Trim', value: vehicle?.trim || apiData?.trim },
    { label: 'Series', value: apiData?.series },
    { label: 'Body Class', value: apiData?.body_class },
    { label: 'Vehicle Type', value: apiData?.vehicle_type },
    { label: 'Doors', value: apiData?.doors },
    {
      label: 'Plant Location',
      value:
        apiData?.plant_city && apiData?.plant_country
          ? `${apiData.plant_city}, ${apiData.plant_country}`
          : apiData?.plant_city || apiData?.plant_country,
    },
    { label: 'Drive Type', value: apiData?.drive_type },
    {
      label: 'Engine',
      value: apiData?.engine_number_of_cylinders
        ? `${apiData.engine_number_of_cylinders} Cylinders`
        : undefined,
    },
  ];
}

export function getSpecificationsFields(apiData?: VinLookupResponse): DataField[] {
  return [
    { label: 'Seats', value: apiData?.number_of_seats },
    { label: 'Seat Rows', value: apiData?.number_of_seat_rows },
    {
      label: 'Wheelbase',
      value: apiData?.['wheel_base_(inches)_from']
        ? `${apiData['wheel_base_(inches)_from']}"`
        : undefined,
    },
    { label: 'Number of Wheels', value: apiData?.number_of_wheels },
    {
      label: 'Front Wheel Size',
      value: apiData?.['wheel_size_front_(inches)']
        ? `${apiData['wheel_size_front_(inches)']}"`
        : undefined,
    },
    {
      label: 'Rear Wheel Size',
      value: apiData?.['wheel_size_rear_(inches)']
        ? `${apiData['wheel_size_rear_(inches)']}"`
        : undefined,
    },
    { label: 'Axles', value: apiData?.axles },
    { label: 'Steering Location', value: apiData?.steering_location },
  ];
}

export function getEngineFields(apiData?: VinLookupResponse): DataField[] {
  return [
    { label: 'Cylinders', value: apiData?.engine_number_of_cylinders },
    { label: 'Displacement (L)', value: apiData?.['displacement_(l)'] },
    { label: 'Displacement (cc)', value: apiData?.['displacement_(cc)'] },
    {
      label: 'Displacement (ci)',
      value: apiData?.['displacement_(ci)']
        ? parseFloat(apiData['displacement_(ci)']).toFixed(1)
        : undefined,
    },
    { label: 'Fuel Type', value: apiData?.['fuel_type_-_primary'] },
    {
      label: 'Horsepower',
      value: apiData?.['engine_brake_(hp)_from']
        ? `${apiData['engine_brake_(hp)_from']} HP`
        : undefined,
    },
    {
      label: 'Top Speed',
      value: apiData?.['top_speed_(mph)'] ? `${apiData['top_speed_(mph)']} mph` : undefined,
    },
  ];
}

export function getTransmissionFields(apiData?: VinLookupResponse): DataField[] {
  return [
    { label: 'Transmission Style', value: apiData?.transmission_style },
    {
      label: 'Transmission Speeds',
      value: apiData?.transmission_speeds ? `${apiData.transmission_speeds}-Speed` : undefined,
    },
  ];
}

export function getSafetyFields(apiData?: VinLookupResponse): DataField[] {
  return [
    { label: 'ABS', value: apiData?.['anti-lock_braking_system_(abs)'] },
    { label: 'ESC', value: apiData?.['electronic_stability_control_(esc)'] },
    { label: 'Traction Control', value: apiData?.traction_control },
    { label: 'TPMS Type', value: apiData?.['tire_pressure_monitoring_system_(tpms)_type'] },
    { label: 'Seat Belt Type', value: apiData?.seat_belt_type },
    { label: 'Pretensioner', value: apiData?.pretensioner },
    { label: 'Front Airbags', value: apiData?.front_air_bag_locations },
    { label: 'Side Airbags', value: apiData?.side_air_bag_locations },
    { label: 'Curtain Airbags', value: apiData?.curtain_air_bag_locations },
    { label: 'Knee Airbags', value: apiData?.knee_air_bag_locations },
  ];
}

export function getDriverAssistanceFields(apiData?: VinLookupResponse): DataField[] {
  return [
    { label: 'Adaptive Cruise Control', value: apiData?.['adaptive_cruise_control_(acc)'] },
    { label: 'Forward Collision Warning', value: apiData?.['forward_collision_warning_(fcw)'] },
    { label: 'Crash Imminent Braking', value: apiData?.['crash_imminent_braking_(cib)'] },
    { label: 'Dynamic Brake Support', value: apiData?.['dynamic_brake_support_(dbs)'] },
    { label: 'Blind Spot Warning', value: apiData?.['blind_spot_warning_(bsw)'] },
    { label: 'Lane Departure Warning', value: apiData?.['lane_departure_warning_(ldw)'] },
    { label: 'Lane Keeping Assistance', value: apiData?.['lane_keeping_assistance_(lka)'] },
    { label: 'Backup Camera', value: apiData?.backup_camera },
    { label: 'Parking Assist', value: apiData?.parking_assist },
  ];
}

export function getConvenienceFields(apiData?: VinLookupResponse): DataField[] {
  return [
    { label: 'Keyless Ignition', value: apiData?.keyless_ignition },
    {
      label: 'Auto-Reverse Windows/Sunroof',
      value: apiData?.['auto-reverse_system_for_windows_and_sunroofs'],
    },
    { label: 'Daytime Running Lights', value: apiData?.['daytime_running_light_(drl)'] },
    {
      label: 'Automatic High Beams',
      value: apiData?.semiautomatic_headlamp_beam_switching,
    },
    { label: 'Adaptive Driving Beam', value: apiData?.['adaptive_driving_beam_(adb)'] },
    {
      label: 'Automatic Crash Notification',
      value:
        apiData?.[
          'automatic_crash_notification_(acn)_/_advanced_automatic_crash_notification_(aacn)'
        ],
    },
  ];
}

export function getOtherInfoFields(apiData?: VinLookupResponse): DataField[] {
  return [
    {
      label: 'Base Price',
      value: apiData?.['base_price_($)']
        ? `$${parseFloat(apiData['base_price_($)']).toLocaleString()}`
        : undefined,
    },
  ];
}
