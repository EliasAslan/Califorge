import React from 'react';
import NumberField from './NumberField';

/**
 * Stepper delegates to NumberField to ensure null values are preserved
 * and not silently converted to zero.
 */
export default function Stepper(props) {
  return <NumberField {...props} />;
}
