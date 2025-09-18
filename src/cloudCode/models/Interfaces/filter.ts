export interface Filter {
  key: string;
  value: string | number | string[];
  type: 'string' | 'min' | 'max' | 'array' | 'text' | 'dropdown';
}
