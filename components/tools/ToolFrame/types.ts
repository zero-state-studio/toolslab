import type { ReactNode } from 'react';

export interface ToolFramePrimaryAction {
  label: string;
  onClick: () => void | Promise<void>;
  icon?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
  loading?: boolean;
}

export interface ToolFrameSecondaryAction {
  label: string;
  onClick: () => void | Promise<void>;
  icon?: ReactNode;
  variant?: 'outline' | 'ghost';
}

export interface ToolFrameProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  categoryColor?: string;
  primaryAction?: ToolFramePrimaryAction;
  secondaryActions?: ToolFrameSecondaryAction[];
  error?: string | null;
  loading?: boolean;
  loadingMessage?: string;
  className?: string;
  children: ReactNode;
}

export interface ToolFrameOptionsProps {
  label?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export interface ToolFrameOutputAction {
  type: 'copy' | 'download' | 'regenerate' | 'custom';
  label?: string;
  onClick?: () => void | Promise<void>;
  icon?: ReactNode;
  data?: string;
  filename?: string;
}

export interface ToolFrameOutputProps {
  title?: string;
  value?: string;
  copyText?: string;
  downloadText?: string;
  downloadFilename?: string;
  onRegenerate?: () => void;
  customActions?: ToolFrameSecondaryAction[];
  emptyState?: ReactNode;
  show?: boolean;
  children?: ReactNode;
  className?: string;
}

export interface ToolFrameSectionProps {
  title?: string;
  description?: string;
  className?: string;
  children: ReactNode;
}
