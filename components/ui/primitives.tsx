"use client";
import { useRef, type ReactNode, type ButtonHTMLAttributes } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Inbox, ChevronRight, Info } from "lucide-react";

export function Button({
  variant = "",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "danger" | "ghost" | "";
}) {
  return <button className={`button ${variant} ${className}`} {...props} />;
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "positive" | "negative" | "warning" | "info" | "neutral";
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {(title || action) && (
        <div className="panel-header">
          <h2>{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="header-actions">{children}</div>
    </header>
  );
}
export function Drawer({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  const opener = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="drawer"
          onOpenAutoFocus={() => {
            opener.current = document.activeElement as HTMLElement;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus();
          }}
        >
          <div className="drawer-heading">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close className="icon-button" aria-label="Close details">
              <X size={19} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Inspect simulated records and available paper-mode actions.
          </Dialog.Description>
          <div className="drawer-body">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  danger = false,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  danger?: boolean;
}) {
  const opener = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="confirm-dialog"
          onOpenAutoFocus={() => {
            opener.current = document.activeElement as HTMLElement;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus();
          }}
        >
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{description}</Dialog.Description>
          <div className="header-actions">
            <Dialog.Close asChild>
              <Button>Cancel</Button>
            </Dialog.Close>
            <Button
              variant={danger ? "danger" : "primary"}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              Confirm
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <Inbox size={25} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function Metric({
  label,
  value,
  detail,
  tone = "",
  help,
}: {
  label: string;
  value: ReactNode;
  detail: ReactNode;
  tone?: string;
  help?: string;
}) {
  return (
    <div className="metric">
      <div className="metric-label">
        {label}
        {help && (
          <span title={help} tabIndex={0} aria-label={help}>
            <Info size={12} />
          </span>
        )}
      </div>
      <div className="metric-value">{value}</div>
      <div className={`metric-detail ${tone}`}>{detail}</div>
    </div>
  );
}
export function AssetIcon({ id, size = 30 }: { id: string; size?: number }) {
  return (
    <span
      className={`asset-icon asset-${id.toLowerCase()}`}
      style={{ width: size, height: size, fontSize: size * 0.46 }}
    >
      {id === "BTC"
        ? "₿"
        : id === "ETH"
          ? "Ξ"
          : id === "SOL"
            ? "≋"
            : id.slice(0, 1)}
    </span>
  );
}
export function ArrowLink() {
  return <ChevronRight size={16} />;
}
