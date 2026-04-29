import AutoPlan from "@/pages/AutoPlan";
import DrillLibrary from "@/pages/DrillLibrary";
type MobilePrimaryPagerProps = {
  progress: number;
  isDragging: boolean;
};

export const MobilePrimaryPager = ({ progress, isDragging }: MobilePrimaryPagerProps) => {
  return (
    <div className="-mx-4 overflow-hidden sm:-mx-6 md:mx-0">
      <div
        className="flex w-[200%] will-change-transform"
        style={{
          transform: `translate3d(${-progress * 50}%, 0, 0)`,
          transition: isDragging
            ? "none"
            : "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <section className="w-1/2 shrink-0 px-4 sm:px-6" aria-label="Auto Plan">
          <AutoPlan />
        </section>
        <section className="w-1/2 shrink-0 px-4 sm:px-6" aria-label="Drill Library">
          <DrillLibrary />
        </section>
      </div>
    </div>
  );
};
