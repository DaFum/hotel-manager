import { useState } from "react";
import { useGameStore } from "./gameStore";
import { SaveManager } from "../ui/SaveManager";
import { CITY } from "../game/content/1991/frankfurt";
import { STARTER_HOTEL } from "../game/content/1991/starterHotel";
import { getRate } from "../game/revenue/rates";
import { connectivityIndex } from "../game/transport/network";
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
import { CityDashboard } from "../ui/market/CityDashboard";
import { CompetitorTable } from "../ui/market/CompetitorTable";
import { marketWageMinor } from "../game/labor/market";
import { BASE_MONTHLY_WAGE_MINOR } from "../game/content/1991/cityMarket";
import { REPORT_COST_MINOR } from "../game/marketResearch/forecast";
import { ManagementShell } from "../ui/ManagementShell";
import { TechnologyPanel } from "../ui/TechnologyPanel";
import { PortfolioDashboard } from "../ui/company/PortfolioDashboard";
import { BrandDashboard } from "../ui/company/BrandDashboard";
import { DevelopmentDashboard } from "../ui/company/DevelopmentDashboard";
import { ManagerGovernancePanel } from "../ui/company/ManagerGovernancePanel";
import {
  brandAuditRows,
  brandRows,
  developmentRows,
  escalationRows,
  managerRows,
  portfolioRows,
} from "../ui/company/companyViewModel";
import type { OpeningChecklistItem } from "../game/development/preOpening";

function seedFromLocation(): number {
  if (typeof window === "undefined") return 424242;
  const raw = new URLSearchParams(window.location.search).get("seed");
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 424242;
}

function rendererDisabled(): boolean {
  return (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("renderer") === "off"
  );
}

export function App() {
  const [seed] = useState(seedFromLocation);
  const game = useGameStore(seed);
  // Dismissal is tracked per closed month so February's report is not hidden
  // by January's "Continue".
  const [dismissedClose, setDismissedClose] = useState<string | null>(null);
  const [openAlert, setOpenAlert] = useState<string | null>(null);
  /** Which house the group is currently looking at; the flagship by default. */
  const [openHotel, setOpenHotel] = useState<string | null>(null);
  const s = game.snapshot;

  if (!s)
    return (
      <main aria-label="Hotel Manager">
        <h1>Hotel Manager</h1>
        <p>Starting {CITY.name} 1991…</p>
      </main>
    );

  const cityWageMinor = marketWageMinor(
    BASE_MONTHLY_WAGE_MINOR,
    s.cityMarket.wagePressureBp,
  );

  const singleRateMinor = getRate(
    s.rates,
    s.calendar.dateKey,
    "single",
    STARTER_HOTEL.defaultRateMinor.single,
  );

  const adoption = Object.fromEntries(
    s.world.technologies.map((technology) => [
      technology.id,
      technology.adoptionBp,
    ]),
  );
  return (
    <ManagementShell
      adoption={{
        personalComputerBp: adoption["personal-computer"] ?? 0,
        internetBp: adoption.internet ?? 0,
        smartphoneBp: adoption.smartphone ?? 0,
        channelManagerBp: adoption["channel-manager"] ?? 0,
      }}
    >
      <main aria-label="Hotel Manager">
        <h1>
          {s.hotel.name}, {CITY.name} 1991
        </h1>
        <p role="status" aria-live="polite">
          {game.errors.length > 0 ? game.errors[game.errors.length - 1] : ""}
        </p>
        <p aria-label="Command status" aria-live="polite">
          Command: {game.commandStatus}
        </p>
        <p aria-label="Saves committed">Saves committed: {game.savedCount}</p>
        <TopBar
          city={CITY.name}
          dateKey={s.calendar.dateKey}
          minuteOfDay={s.calendar.minuteOfDay}
          cashMinor={s.finance.cashMinor}
          speed={game.speed}
          onSpeed={game.setSpeed}
          onSave={() => game.save()}
          onLoad={() => game.load()}
        />
        <SaveManager
          slots={game.slots}
          recoveredFrom={game.recoveredFrom}
          validationFailure={game.validationFailure}
          onSave={(slot) => game.save(slot)}
          onLoad={(slot) => game.load(slot)}
        />
        <HotelView
          rooms={s.hotel.rooms}
          facilities={s.facilities}
          disableRenderer={rendererDisabled()}
        />
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
        <CityDashboard
          business={s.cityMarket.demand.business}
          leisure={s.cityMarket.demand.leisure}
          event={s.cityMarket.demand.event}
          group={s.cityMarket.demand.group}
          low={s.cityMarket.forecast.low}
          high={s.cityMarket.forecast.high}
          connectivityIndex={connectivityIndex(s.cityMarket.transport)}
          informationQuality={s.cityMarket.informationQuality}
          researchCostMinor={REPORT_COST_MINOR}
          onBuyResearch={() => game.send({ type: "BUY_MARKET_RESEARCH" })}
        />
        <CompetitorTable
          rows={s.competitors}
          playerRateMinor={singleRateMinor}
          playerOccupancyBp={s.metrics.occupancyBasisPoints}
        />
        <PortfolioDashboard
          hotels={portfolioRows(s)}
          onOpenHotel={setOpenHotel}
        />
        <p aria-label="Selected hotel">Viewing: {openHotel ?? s.hotel.id}</p>
        <BrandDashboard
          brands={brandRows(s)}
          audits={brandAuditRows(s)}
          hotels={portfolioRows(s).map((h) => ({ id: h.id, name: h.name }))}
          onAssignBrand={(hotelId, brandId) =>
            game.send({ type: "ASSIGN_BRAND", hotelId, brandId })
          }
        />
        <DevelopmentDashboard
          developments={developmentRows(s)}
          onCompleteTask={(developmentId, item) =>
            game.send({
              type: "COMPLETE_PRE_OPENING_TASK",
              developmentId,
              item: item as OpeningChecklistItem,
            })
          }
          onOpen={(developmentId) =>
            game.send({ type: "OPEN_DEVELOPMENT", developmentId })
          }
        />
        <ManagerGovernancePanel
          managers={managerRows(s)}
          escalations={escalationRows(s)}
          onSetRepairLimit={(hotelId, repairLimitMinor) =>
            game.send({
              type: "SET_MANAGER_AUTHORITY",
              hotelId,
              authority: { repairLimitMinor },
            })
          }
          onResolve={(escalationId, approve) =>
            game.send({ type: "RESOLVE_ESCALATION", escalationId, approve })
          }
        />
        <TechnologyPanel
          technologies={s.world.technologies}
          projects={s.technologyProjects}
          implementations={s.technologyImplementations}
          onAdopt={(technologyId) =>
            game.send({ type: "ADOPT_TECHNOLOGY", technologyId })
          }
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
          marketWageMinor={cityWageMinor}
          onHire={(role) =>
            game.send({
              type: "HIRE",
              role,
              shift: "morning",
              // The house never offers under the going rate; a tight labour
              // market is paid for, not worked around.
              monthlyWageMinor: Math.max(250_000, cityWageMinor),
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
            s.lastMonthlyClose &&
            s.lastMonthlyClose.periodKey !== dismissedClose
              ? s.lastMonthlyClose
              : null
          }
          onDismiss={() =>
            setDismissedClose(s.lastMonthlyClose?.periodKey ?? null)
          }
        />
      </main>
    </ManagementShell>
  );
}
