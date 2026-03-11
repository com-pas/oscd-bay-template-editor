<?xml version="1.0" encoding="UTF-8"?><SCL xmlns="http://www.iec.ch/61850/2003/SCL" xmlns:eosld="https://openscd.org/SCL/SSD/SLD/v0" version="2007" revision="B" release="4">

  <Header id="development sample"/>
  <Substation name="S1">
    <Private type="OpenSCD-SLD-Layout">
      <eosld:SLDAttributes eosld:w="50" eosld:h="25"/>
    </Private>
    <VoltageLevel name="V1">
      <Private type="OpenSCD-SLD-Layout">
        <eosld:SLDAttributes eosld:x="1" eosld:y="1" eosld:lx="1" eosld:ly="1" eosld:w="48" eosld:h="22"/>
      </Private>
      <Bay name="B2">
        <Private type="OpenSCD-SLD-Layout">
          <eosld:SLDAttributes eosld:x="14" eosld:y="2" eosld:lx="14" eosld:ly="2" eosld:w="12" eosld:h="20"/>
        </Private>
        <Function name="P27">
          <Private type="OpenSCD-SLD-Layout">
            <eosld:SLDAttributes eosld:x="20" eosld:y="12"/>
          </Private>
          <SubFunction name="UnderVoltage">
            <LNode iedName="None" lnClass="PTUV" lnInst="1"/>
          </SubFunction>
        </Function>
      </Bay>
      <Bay name="B1">
        <Private type="OpenSCD-SLD-Layout">
          <eosld:SLDAttributes eosld:x="2" eosld:y="2" eosld:lx="2" eosld:ly="2" eosld:w="11" eosld:h="20"/>
        </Private>
        <Function name="P51">
          <Private type="OpenSCD-SLD-Layout">
            <eosld:SLDAttributes eosld:x="7" eosld:y="10"/>
          </Private>
          <SubFunction name="Stage1">
            <LNode iedName="None" lnClass="PTOC" lnInst="1"/>
          </SubFunction>
          <SubFunction name="Stage2">
            <LNode iedName="None" lnClass="PTOC" lnInst="2"/>
          </SubFunction>
        </Function>
        <Function name="P51N">
          <Private type="OpenSCD-SLD-Layout">
            <eosld:SLDAttributes eosld:x="8" eosld:y="14"/>
          </Private>
          <SubFunction name="General">
            <LNode iedName="None" lnClass="PTRC" lnInst="1"/>
          </SubFunction>
          <SubFunction name="Stage1">
            <LNode iedName="None" lnClass="PTOC" lnInst="1"/>
          </SubFunction>
        </Function>
        <Function name="CTRL">
          <Private type="OpenSCD-SLD-Layout">
            <eosld:SLDAttributes eosld:x="4" eosld:y="15"/>
          </Private>
          <SubFunction name="Control">
            <LNode iedName="None" lnClass="CSWI" lnInst="1"/>
            <LNode iedName="None" lnClass="CILO" lnInst="1"/>
          </SubFunction>
        </Function>
      </Bay>
      <Function name="VoltageLevelFunc">
        <Private type="OpenSCD-SLD-Layout">
          <eosld:SLDAttributes eosld:x="35" eosld:y="10"/>
        </Private>
        <SubFunction name="Regulation">
          <LNode iedName="None" lnClass="ATCC" lnInst="1"/>
        </SubFunction>
      </Function>
    </VoltageLevel>
    <Function name="SubstationFunc">
      <Private type="OpenSCD-SLD-Layout">
        <eosld:SLDAttributes eosld:x="40" eosld:y="5"/>
      </Private>
      <SubFunction name="Monitoring">
        <LNode iedName="None" lnClass="ANCR" lnInst="1"/>
      </SubFunction>
    </Function>
  </Substation>
</SCL>