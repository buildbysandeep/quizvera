import AddGroup from "@/components/dialogs/AddGroup";
import { FolderPlus, Layers3, Sparkles } from "lucide-react";

const NoGroups = () => {
  return (
    <section className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
      <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-indigo-50 ring-1 ring-inset ring-indigo-100">
        <FolderPlus className="h-7 w-7 text-indigo-600" />
        <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-white text-indigo-600 shadow-sm">
          <Sparkles className="h-3 w-3" />
        </span>
      </div>

      <span className="mt-5 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
        Workspace setup
      </span>
      <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900">No groups yet</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        Create a group to organize your quizzes by class, subject, or project. You can add quizzes after that.
      </p>

      <div className="mt-5">
        <AddGroup />
      </div>

      <div className="mt-8 flex items-center gap-2 text-xs text-slate-400">
        <Layers3 className="h-3.5 w-3.5" />
        <span>Groups help keep assessments organized</span>
      </div>
    </section>
  );
};

export default NoGroups;
