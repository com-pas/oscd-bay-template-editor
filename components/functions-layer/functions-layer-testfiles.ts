export const docWithBayAndFunctions = `<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL"
  xmlns:eosld="https://openscd.org/SCL/SSD/SLD/v0" version="2007" revision="B">
  <Substation name="S1">
    <Private type="OpenSCD-SLD-Layout">
      <eosld:SLDAttributes eosld:w="50" eosld:h="25" />
    </Private>
    <VoltageLevel name="V1">
      <Bay name="B1">
        <Private type="OpenSCD-SLD-Layout">
          <eosld:SLDAttributes eosld:x="5" eosld:y="5" eosld:w="20" eosld:h="15" />
        </Private>
        <Function name="F1">
          <Private type="OpenSCD-SLD-Layout">
            <eosld:SLDAttributes eosld:x="10" eosld:y="10" />
          </Private>
        </Function>
        <Function name="F2">
          <Private type="OpenSCD-SLD-Layout">
            <eosld:SLDAttributes eosld:x="15" eosld:y="12" />
          </Private>
        </Function>
        <ConductingEquipment name="CE1" />
      </Bay>
    </VoltageLevel>
  </Substation>
</SCL>`;

export const docWithoutFunctions = `<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL"
  xmlns:eosld="https://openscd.org/SCL/SSD/SLD/v0" version="2007" revision="B">
  <Substation name="S1">
    <Private type="OpenSCD-SLD-Layout">
      <eosld:SLDAttributes eosld:w="50" eosld:h="25" />
    </Private>
    <VoltageLevel name="V1">
      <Bay name="B1">
        <Private type="OpenSCD-SLD-Layout">
          <eosld:SLDAttributes eosld:x="5" eosld:y="5" eosld:w="20" eosld:h="15" />
        </Private>
      </Bay>
    </VoltageLevel>
  </Substation>
</SCL>`;

export const docWithFunctionWithoutBay = `<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL"
  xmlns:eosld="https://openscd.org/SCL/SSD/SLD/v0" version="2007" revision="B">
  <Substation name="S1">
    <Private type="OpenSCD-SLD-Layout">
      <eosld:SLDAttributes eosld:w="50" eosld:h="25" />
    </Private>
    <VoltageLevel name="V1">
      <Function name="F1">
        <Private type="OpenSCD-SLD-Layout">
          <eosld:SLDAttributes eosld:x="10" eosld:y="10" />
        </Private>
      </Function>
    </VoltageLevel>
  </Substation>
</SCL>`;

export const docWithNestedFunctions = `<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL"
  xmlns:eosld="https://openscd.org/SCL/SSD/SLD/v0" version="2007" revision="B">
  <Substation name="S1">
    <Private type="OpenSCD-SLD-Layout">
      <eosld:SLDAttributes eosld:w="50" eosld:h="25" />
    </Private>
    <VoltageLevel name="V1">
      <Bay name="B1">
        <Private type="OpenSCD-SLD-Layout">
          <eosld:SLDAttributes eosld:x="5" eosld:y="5" eosld:w="20" eosld:h="15" />
        </Private>
        <Function name="F1">
          <Private type="OpenSCD-SLD-Layout">
            <eosld:SLDAttributes eosld:x="10" eosld:y="10" />
          </Private>
          <SubFunction name="SF1">
            <Private type="OpenSCD-SLD-Layout">
              <eosld:SLDAttributes eosld:x="12" eosld:y="12" />
            </Private>
          </SubFunction>
          <LNode id="LN1" lnClass="LLN0" desc="Logical Node 1">
            <Private type="OpenSCD-SLD-Layout">
              <eosld:SLDAttributes eosld:x="14" eosld:y="14" />
            </Private>
          </LNode>
        </Function>
      </Bay>
    </VoltageLevel>
  </Substation>
</SCL>`;
