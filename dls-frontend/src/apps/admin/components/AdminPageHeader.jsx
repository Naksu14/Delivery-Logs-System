export default function AdminPageHeader({ title, subtitle, actions }) {
  return (
    <div className="mx-auto flex w-full flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="admin-page__title">{title}</h1>
        {subtitle ? <p className="admin-page__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="w-full md:w-auto">{actions}</div> : null}
    </div>
  )
}
