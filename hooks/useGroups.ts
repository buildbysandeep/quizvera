"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { fetcher, fetcherOpt } from "@/lib/utils";
import { useDataStore } from "@/stores/data";
import type { IGroup } from "@/types";

export const useGroups = () => {
  const groups = useDataStore((state) => state.groups ?? []);
  const setGroups = useDataStore((state) => state.setGroups);
  const { data, isLoading, error } = useSWR("/api/groups", fetcher, fetcherOpt);

  useEffect(() => {
    if (data?.ok && Array.isArray(data.data)) {
      setGroups(data.data as IGroup[]);
    }
  }, [data, setGroups]);

  return {
    groups: (groups.length ? groups : Array.isArray(data?.data) ? data.data : []) as IGroup[],
    isLoading,
    error: error ?? (data && !data.ok ? data.error || "Could not load groups." : null),
  };
};
