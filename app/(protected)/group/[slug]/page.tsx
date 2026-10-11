import React from "react";
import GroupDetail from "../detail";

export default function GroupPage({ params }: { params: { slug: string } }) {
  return <GroupDetail slug={params.slug} />;
}
