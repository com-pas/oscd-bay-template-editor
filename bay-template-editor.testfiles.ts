export const emptyDoc = `<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL" version="2007" revision="B">
</SCL>`;

export const docWithSubstation = `<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL" version="2007" revision="B">
  <Substation name="S1" />
</SCL>`;

export const docWithVoltageLevel = `<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL" version="2007" revision="B">
  <Substation name="S1">
    <VoltageLevel name="V1" />
  </Substation>
</SCL>`;

export const docWithBay = `<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL" version="2007" revision="B">
  <Substation name="S1">
    <VoltageLevel name="V1">
      <Bay name="B1" />
    </VoltageLevel>
  </Substation>
</SCL>`;

export const docWithBusBarBay = `<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL"
  xmlns:eosld="https://openscd.org/SCL/SSD/SLD/v0" version="2007" revision="B">
  <Substation name="S1">
    <VoltageLevel name="110kV">
      <Bay name="BB1">
        <Private type="OpenSCD-SLD-Layout">
          <eosld:SLDAttributes eosld:x="2" eosld:y="2" eosld:w="20" eosld:h="3"/>
          <Section name="BUS1" eosld:bus="true" eosld:x="2" eosld:y="2"
                   eosld:w="18" eosld:h="2"/>
        </Private>
      </Bay>
    </VoltageLevel>
  </Substation>
</SCL>`;
