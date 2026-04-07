import { Contract, rpc, TransactionBuilder, Networks, nativeToScVal, Address, scValToNative } from '@stellar/stellar-sdk';
try {
    nativeToScVal("M-123", { type: "string" });
    const ownerAddress = "GPRX2C2BJWQWY3K6MJDYZ7X7QZ2Z7X7QZ2Z7X7QZ2Z7X7QZ2Z7X7Q";
    new Address(ownerAddress).toScVal();
    console.log("No error up to nativeToScVal!");
} catch (e: any) {
    console.error(e.message);
}
