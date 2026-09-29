export default function TermsPage(){
  return (
    <main className="shell">
      <div className="topbar">
        <a className="brand" href="/">Mira Play</a>
        <a className="btn secondary" href="/register">Back to registration</a>
      </div>
      <article className="card" style={{maxWidth:820,margin:'0 auto'}}>
        <h1 style={{fontSize:36,marginBottom:12}}>Terms & Conditions</h1>
        <p className="muted">Mira Play is a community tennis court booking service for eligible Mira and Mira Oasis residents.</p>

        <h2>Account and villa access</h2>
        <p>Each villa may have one active resident email linked to the villa. Registrations, villa claims, and registered-email changes may require administrator approval.</p>

        <h2>Booking rules</h2>
        <p>Bookings may be for 1 hour or 2 consecutive hours. Either duration counts as one booking. A villa may make up to 2 bookings per day and hold up to 6 active future bookings.</p>

        <h2>Operating hours and booking window</h2>
        <p>Courts operate from 07:00 to 22:00. Bookings are available within the rolling booking window shown in Mira Play.</p>

        <h2>Cancellations and fair use</h2>
        <p>Residents may cancel a booking before it begins. Residents must use the booking system fairly and should cancel bookings they no longer intend to use.</p>

        <h2>No-show reporting</h2>
        <p>Residents may report an unattended booking during the permitted reporting window. Reports are private to administrators and are subject to administrator review.</p>

        <h2>Resident responsibilities</h2>
        <p>Residents must provide accurate contact and villa information, keep account credentials secure, and comply with community booking rules. Misuse may result in suspension of booking access.</p>

        <h2>Changes to these terms</h2>
        <p>Community booking rules may be updated from time to time. Material changes will be reflected in Mira Play.</p>

        <p className="tag" style={{marginTop:28}}>V1 community draft. Final community/legal wording can be refined before public launch.</p>
      </article>
    </main>
  )
}
