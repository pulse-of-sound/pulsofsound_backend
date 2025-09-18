import {MultiLangs} from './MultiLangs';

export type FormTemplateInput = {
  id?: string;
  order?: number;
  placeholder?: MultiLangs;
  label?: MultiLangs;
  required?: boolean;
  defValue?: any;
  disabled?: boolean;
  type?:
    | 'text'
    | 'number'
    | 'date'
    | 'textArea'
    | 'dropdown'
    | 'boolean'
    | 'location'
    | 'file'
    | 'multiSelect';
  options?: string;
  getUserValueFrom?: string;
  min?: number;
  max?: number;
  rows?: number;
  step?: number;
  validation?: {
    min?: number;
    max?: number;
    selectedValue_string?: string[];
    file_type?: string[];
  };
  user_value?: any;
  viewCondition?: string;
  description?: MultiLangs;
  filterable?:boolean
};

export type FileTypes = {};

export type FormTemplateSection = {
  section_id?: string;
  section_label?: MultiLangs;
  section_order?: number;
  inputs?: FormTemplateInput[];
};
