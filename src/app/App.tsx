import { useState } from "react";
import { useGameStore } from "./gameStore";
import { CITY } from "../game/content/1991/frankfurt";
import { STARTER_HOTEL } from "../game/content/1991/starterHotel";
import { getRate } from "../game/revenue/rates";
import { TopBar } from "../ui/TopBar";
import { HotelView } from "../ui/HotelView";
import { RevenueDashboard } from "../ui/RevenueDashboard";
import { StaffDashboard } from "../ui/StaffDashboard";
import { PurchasingDashboard } from "../ui/PurchasingDashboard";
import { FinanceDashboard } from "../ui/FinanceDashboard";
import { BuildPanel } from "../ui/BuildPanel";
import { AlertsPanel } from "../ui/AlertsPanel";
import { FacilitiesDashboard } from "../ui/facilities/FacilitiesDashboard";
import { ClassificationPanel } from "../ui/facilities/ClassificationPanel";
import { STAFF_ROLES } from "../game/domain/staffRoles";
import { MonthlyCloseModal } from "../ui/MonthlyCloseModal";

function seedFromLocation(): number {
  if (typeof window === "undefined") return 424242;
  const raw = new URLSearchParams(window.location.search).get("seed");
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 424242;
}

export function App() {
  const [seed] = useState(seedFromLocation);
  const game = useGameStore(seed);
  // Dismissal is tracked per closed month so February's report is not hidden
  // by January's "Continue".
  const [dismissedClose, setDismissedClose] = useState<string | null>(null);
  const [openAlert, setOpenAlert] = useState<string | null>(null);
  const s = game.snapshot;

  if (!s)
    return (
      <main aria-label="Hotel Manager">
        <h1>Hotel Manager</h1>
        <p>Starting {CITY.name} 1991…</p>
      </main>
    );

  const singleRateMinor = getRate(
    s.rates,
    s.calendar.dateKey,
    "single",
    STARTER_HOTEL.defaultRateMinor.single,
  );

  return (
    <main aria-label="Hotel Manager">
      <h1>
        {s.hotel.name}, {CITY.name} 1991
      </h1>
      <p role="status" aria-live="polite">
        {game.errors.length > 0 ? game.errors[game.errors.length - 1] : ""}
      </p>
      <p aria-label="Saves committed">Saves committed: {game.savedCount}</p>
      <TopBar
        city={CITY.name}
        dateKey={s.calendar.dateKey}
        minuteOfDay={s.calendar.minuteOfDay}
        cashMinor={s.finance.cashMinor}
        speed={game.speed}
        onSpeed={game.setSpeed}
        onSave={game.save}
        onLoad={game.load}
      />
      <HotelView rooms={s.hotel.rooms} facilities={s.facilities} />
      <FacilitiesDashboard rows={s.facilities} />
      <ClassificationPanel
        classification={s.classification}
        specializationId={s.specializationId}
        investedArea={s.investedArea}
        onSetSpecialization={(specializationId) =>
          game.send({ type: "SET_SPECIALIZATION", specializationId })
        }
        onExpand={(area) => game.send({ type: "EXPAND_FACILITY", area })}
      />
      <RevenueDashboard
        adrMinor={s.metrics.adrMinor}
        revParMinor={s.metrics.revParMinor}
        occupancyBasisPoints={s.metrics.occupancyBasisPoints}
        singleRateMinor={singleRateMinor}
        onSetSingleRate={(rateMinor) =>
          game.send({
            type: "SET_RATE",
            dateKey: s.calendar.dateKey,
            category: "single",
            rateMinor,
          })
        }
      />
      <StaffDashboard
        staff={s.staff}
        roles={STAFF_ROLES}
        onHire={(role) =>
          game.send({
            type: "HIRE",
            role: role as (typeof STAFF_ROLES)[number],
            shift: "morning",
            monthlyWageMinor: 250_000,
          })
        }
      />
      <PurchasingDashboard
        stock={s.stock}
        onOrder={(sku) =>
          game.send({ type: "ORDER_SUPPLIES", sku, quantity: 60 })
        }
      />
      <FinanceDashboard
        cashMinor={s.finance.cashMinor}
        loanPrincipalMinor={s.loan.principalMinor}
        monthToDateProfitMinor={
          s.finance.month.roomRevenueMinor +
          s.finance.month.otherRevenueMinor -
          s.finance.month.operatingExpenseMinor
        }
      />
      <BuildPanel
        renovationActive={s.renovation !== null}
        onStartRenovation={() => game.send({ type: "START_RENOVATION" })}
      />
      <AlertsPanel
        alerts={s.alerts}
        openAlertId={openAlert}
        onOpen={setOpenAlert}
      />
      <MonthlyCloseModal
        report={
          s.lastMonthlyClose && s.lastMonthlyClose.periodKey !== dismissedClose
            ? s.lastMonthlyClose
            : null
        }
        onDismiss={() =>
          setDismissedClose(s.lastMonthlyClose?.periodKey ?? null)
        }
      />
    </main>
  );
}
