import React from "react";
import styles from "./Loading.module.css";

type LoadingProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
};

const Loading = ({ className, size = "md", label = "Loading" }: LoadingProps) => {
  return (
    <div
      className={[styles.loader, styles[size], className].filter(Boolean).join(" ")}
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span className={styles.srOnly}>{label}...</span>
    </div>
  );
};

export default Loading;
