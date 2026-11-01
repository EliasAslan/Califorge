import React from 'react';
import NumberField from './NumberField';

/**
 * Replaced experimental drag picker with the integrated compact numeric field.
 * Avoids window.prompt and mobile scroll conflicts.
 */
export default function VerticalNumberPicker(props) {
  return <NumberField {...props} />;
}
