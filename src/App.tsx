import React, { useState, useMemo } from 'react';
import { Calculator, Info, Settings2, Receipt } from 'lucide-react';

const FormRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-gray-100 last:border-0">
    <div className="w-full sm:w-1/3 text-gray-600 mb-2 sm:mb-0 text-sm font-medium">{label}</div>
    <div className="w-full sm:w-2/3 flex items-center gap-4">
      {children}
    </div>
  </div>
);

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export default function App() {
  const [salaries, setSalaries] = useState<string[]>(Array(12).fill('10000'));
  const [batchSalary, setBatchSalary] = useState<string>('10000');
  
  const [hasSS, setHasSS] = useState(true);
  const [ssBase, setSsBase] = useState<string>('10000');
  const [ssRate, setSsRate] = useState<string>('10.5');
  
  const [hasPF, setHasPF] = useState(true);
  const [pfBase, setPfBase] = useState<string>('10000');
  const [pfRate, setPfRate] = useState<string>('5');
  
  const [nonTaxableAllowance, setNonTaxableAllowance] = useState<string>('');
  
  const [hasSpecialDeduction, setHasSpecialDeduction] = useState(false);
  const [childrenEdu, setChildrenEdu] = useState(0);
  const [continuingEdu, setContinuingEdu] = useState(0);
  const [elderlyCare, setElderlyCare] = useState(0);
  const [housingLoan, setHousingLoan] = useState(0);
  const [housingRent, setHousingRent] = useState(0);
  const [infantCare, setInfantCare] = useState(0);
  const [personalPension, setPersonalPension] = useState<string>('');

  const specialDeduction = hasSpecialDeduction ? 
    (childrenEdu + continuingEdu + elderlyCare + housingLoan + housingRent + infantCare + (Number(personalPension) || 0)) : 0;

  const handleBatchApply = () => {
    setSalaries(Array(12).fill(batchSalary));
    setSsBase(batchSalary);
    setPfBase(batchSalary);
  };

  const updateSalary = (index: number, value: string) => {
    const newSalaries = [...salaries];
    newSalaries[index] = value;
    setSalaries(newSalaries);
  };

  const calc = useMemo(() => {
    const numSsBase = Number(ssBase) || 0;
    const numSsRate = Number(ssRate) || 0;
    const numPfBase = Number(pfBase) || 0;
    const numPfRate = Number(pfRate) || 0;
    const numAllowance = Number(nonTaxableAllowance) || 0;

    const personalSSRate = numSsRate / 100;
    const companySSRate = numSsRate / 100;

    const personalPF = hasPF ? round2(numPfBase * (numPfRate / 100)) : 0;
    const companyPF = hasPF ? round2(numPfBase * (numPfRate / 100)) : 0;
    const personalSS = hasSS ? round2(numSsBase * personalSSRate) : 0;
    const companySS = hasSS ? round2(numSsBase * companySSRate) : 0;

    let cumulativeIncome = 0;
    let cumulativeTax = 0;
    
    const results = [];

    for (let i = 0; i < 12; i++) {
      const salary = Number(salaries[i]) || 0;
      cumulativeIncome += salary;
      
      const cumulativeExemption = 5000 * (i + 1);
      const cumulativeSSPF = (personalSS + personalPF) * (i + 1);
      const cumulativeSpecial = specialDeduction * (i + 1);
      
      let taxableIncome = cumulativeIncome - cumulativeExemption - cumulativeSSPF - cumulativeSpecial;
      if (taxableIncome < 0) taxableIncome = 0;

      let taxRate = 0;
      let quickDeduction = 0;

      if (taxableIncome <= 36000) { taxRate = 0.03; quickDeduction = 0; }
      else if (taxableIncome <= 144000) { taxRate = 0.10; quickDeduction = 2520; }
      else if (taxableIncome <= 300000) { taxRate = 0.20; quickDeduction = 16920; }
      else if (taxableIncome <= 420000) { taxRate = 0.25; quickDeduction = 31920; }
      else if (taxableIncome <= 660000) { taxRate = 0.30; quickDeduction = 52920; }
      else if (taxableIncome <= 960000) { taxRate = 0.35; quickDeduction = 85920; }
      else { taxRate = 0.45; quickDeduction = 181920; }

      const currentCumulativeTax = taxableIncome * taxRate - quickDeduction;
      const monthlyTax = Math.max(0, currentCumulativeTax - cumulativeTax);
      cumulativeTax = currentCumulativeTax;

      const afterTax = salary - personalSS - personalPF - monthlyTax + numAllowance;

      results.push({
        month: i + 1,
        salary,
        allowance: numAllowance,
        personalSS,
        personalPF,
        tax: monthlyTax,
        afterTax
      });
    }

    return {
      results,
      totalSalary: cumulativeIncome,
      totalAllowance: numAllowance * 12,
      totalPersonalSS: personalSS * 12,
      totalPersonalPF: personalPF * 12,
      totalCompanySS: companySS * 12,
      totalCompanyPF: companyPF * 12,
      totalTax: cumulativeTax,
      totalAfterTax: results.reduce((sum, r) => sum + r.afterTax, 0),
      companyCost: cumulativeIncome + companySS * 12 + companyPF * 12 + numAllowance * 12
    };
  }, [salaries, hasSS, ssBase, ssRate, hasPF, pfBase, pfRate, specialDeduction, nonTaxableAllowance]);

  return (
    <div className="min-h-screen bg-[#f5f7fa] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">个人所得税计算器</h1>
          <p className="text-gray-500">支持每月不同薪资的累计预扣法计算</p>
        </div>

        {/* 薪资设置 */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Settings2 className="w-6 h-6 text-[#00b38a]" />
              每月税前工资设置
            </h2>
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
              <input 
                type="number" 
                value={batchSalary} 
                onChange={e => setBatchSalary(e.target.value)}
                className="bg-transparent px-3 py-1.5 text-sm w-28 focus:outline-none font-medium text-gray-700"
                placeholder="批量金额"
              />
              <button 
                onClick={handleBatchApply}
                className="text-sm bg-white hover:bg-gray-50 text-gray-700 px-4 py-1.5 rounded-md shadow-sm border border-gray-200 transition-all font-medium"
              >
                批量填入
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {salaries.map((s, i) => (
              <div key={i} className="flex flex-col relative group">
                <label className="text-xs font-medium text-gray-500 mb-1.5 ml-1">第 {i + 1} 个月</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
                  <input 
                    type="number" 
                    value={s} 
                    onChange={e => updateSalary(i, e.target.value)}
                    className="w-full border border-gray-200 bg-gray-50 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#00b38a] focus:ring-1 focus:ring-[#00b38a] focus:bg-white transition-all font-medium text-gray-800"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 社保公积金设置 */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-2">
            <Receipt className="w-6 h-6 text-[#00b38a]" />
            五险一金与专项扣除
          </h2>
          <div className="divide-y divide-gray-50">
            <FormRow label="是否缴纳社保">
              <label className="flex items-center gap-2 cursor-pointer mr-6">
                <input type="radio" checked={hasSS} onChange={() => setHasSS(true)} className="w-4 h-4 text-[#00b38a] focus:ring-[#00b38a]" />
                <span className="text-sm text-gray-700">缴纳</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={!hasSS} onChange={() => setHasSS(false)} className="w-4 h-4 text-[#00b38a] focus:ring-[#00b38a]" />
                <span className="text-sm text-gray-700">不缴纳</span>
              </label>
            </FormRow>
            
            {hasSS && (
              <>
                <FormRow label="社保缴纳基数">
                  <div className="relative w-full max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
                    <input 
                      type="number" 
                      value={ssBase} 
                      onChange={e => setSsBase(e.target.value)}
                      className="w-full border border-gray-200 bg-gray-50 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#00b38a] focus:ring-1 focus:ring-[#00b38a] focus:bg-white transition-all font-medium text-gray-800"
                    />
                  </div>
                </FormRow>
                <FormRow label="社保缴纳比例">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
                    <div className="relative w-full max-w-xs sm:w-32">
                      <input 
                        type="number" 
                        value={ssRate} 
                        onChange={e => setSsRate(e.target.value)}
                        className="w-full border border-gray-200 bg-gray-50 rounded-lg pl-3 pr-8 py-2.5 text-sm focus:outline-none focus:border-[#00b38a] focus:ring-1 focus:ring-[#00b38a] focus:bg-white transition-all font-medium text-gray-800"
                        step="0.1"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      预估缴纳：个人 <span className="text-[#ff6b00] font-medium">¥{round2((Number(ssBase) || 0) * (Number(ssRate) || 0) / 100).toFixed(2)}</span> / 公司 <span className="text-[#ff6b00] font-medium">¥{round2((Number(ssBase) || 0) * (Number(ssRate) || 0) / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </FormRow>
              </>
            )}

            <FormRow label="是否缴纳公积金">
              <label className="flex items-center gap-2 cursor-pointer mr-6">
                <input type="radio" checked={hasPF} onChange={() => setHasPF(true)} className="w-4 h-4 text-[#00b38a] focus:ring-[#00b38a]" />
                <span className="text-sm text-gray-700">缴纳</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={!hasPF} onChange={() => setHasPF(false)} className="w-4 h-4 text-[#00b38a] focus:ring-[#00b38a]" />
                <span className="text-sm text-gray-700">不缴纳</span>
              </label>
            </FormRow>

            {hasPF && (
              <>
                <FormRow label="公积金缴纳基数">
                  <div className="relative w-full max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
                    <input 
                      type="number" 
                      value={pfBase} 
                      onChange={e => setPfBase(e.target.value)}
                      className="w-full border border-gray-200 bg-gray-50 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#00b38a] focus:ring-1 focus:ring-[#00b38a] focus:bg-white transition-all font-medium text-gray-800"
                    />
                  </div>
                </FormRow>
                <FormRow label="公积金缴纳比例">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
                    <div className="relative w-full max-w-xs sm:w-32">
                      <input 
                        type="number" 
                        value={pfRate} 
                        onChange={e => setPfRate(e.target.value)}
                        className="w-full border border-gray-200 bg-gray-50 rounded-lg pl-3 pr-8 py-2.5 text-sm focus:outline-none focus:border-[#00b38a] focus:ring-1 focus:ring-[#00b38a] focus:bg-white transition-all font-medium text-gray-800"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      预估缴纳：个人 <span className="text-[#ff6b00] font-medium">¥{round2((Number(pfBase) || 0) * (Number(pfRate) || 0) / 100).toFixed(2)}</span> / 公司 <span className="text-[#ff6b00] font-medium">¥{round2((Number(pfBase) || 0) * (Number(pfRate) || 0) / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </FormRow>
              </>
            )}

            <FormRow label="每月免税补贴">
              <div className="flex items-center gap-3 w-full max-w-xs">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
                  <input 
                    type="number" 
                    value={nonTaxableAllowance} 
                    onChange={e => setNonTaxableAllowance(e.target.value)}
                    className="w-full border border-gray-200 bg-gray-50 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#00b38a] focus:ring-1 focus:ring-[#00b38a] focus:bg-white transition-all font-medium text-gray-800"
                    placeholder="如话费、交通补贴"
                  />
                </div>
                <div className="group relative">
                  <Info className="w-5 h-5 text-gray-400 cursor-help hover:text-[#00b38a] transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 leading-relaxed">
                    如话费补贴、交通补贴等。该金额不计入个税计算基数，但会直接计入您的最终税后收入。
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45"></div>
                  </div>
                </div>
              </div>
            </FormRow>

            <FormRow label="是否包含专项扣除">
              <label className="flex items-center gap-2 cursor-pointer mr-6">
                <input type="radio" checked={hasSpecialDeduction} onChange={() => setHasSpecialDeduction(true)} className="w-4 h-4 text-[#00b38a] focus:ring-[#00b38a]" />
                <span className="text-sm text-gray-700">包含</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={!hasSpecialDeduction} onChange={() => setHasSpecialDeduction(false)} className="w-4 h-4 text-[#00b38a] focus:ring-[#00b38a]" />
                <span className="text-sm text-gray-700">不包含</span>
              </label>
            </FormRow>

            {hasSpecialDeduction && (
              <div className="pl-0 sm:pl-4 border-l-2 border-[#00b38a]/20 ml-0 sm:ml-[33%] my-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-600 w-32">子女教育扣除</span>
                  <select value={childrenEdu} onChange={e => setChildrenEdu(Number(e.target.value))} className="flex-1 border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00b38a] focus:ring-1 focus:ring-[#00b38a] focus:bg-white transition-all text-gray-800">
                    <option value={0}>请选择</option>
                    <option value={2000}>1个子女 (2000元/月)</option>
                    <option value={4000}>2个子女 (4000元/月)</option>
                    <option value={6000}>3个子女 (6000元/月)</option>
                  </select>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-600 w-32">继续教育扣除</span>
                  <select value={continuingEdu} onChange={e => setContinuingEdu(Number(e.target.value))} className="flex-1 border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00b38a] focus:ring-1 focus:ring-[#00b38a] focus:bg-white transition-all text-gray-800">
                    <option value={0}>请选择</option>
                    <option value={400}>学历(学位)继续教育 (400元/月)</option>
                  </select>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-600 w-32">赡养老人扣除</span>
                  <select value={elderlyCare} onChange={e => setElderlyCare(Number(e.target.value))} className="flex-1 border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00b38a] focus:ring-1 focus:ring-[#00b38a] focus:bg-white transition-all text-gray-800">
                    <option value={0}>请选择</option>
                    <option value={3000}>独生子女 (3000元/月)</option>
                    <option value={1500}>非独生子女分摊 (最高1500元/月)</option>
                    <option value={1000}>非独生子女分摊 (1000元/月)</option>
                    <option value={500}>非独生子女分摊 (500元/月)</option>
                  </select>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-600 w-32">住房贷款利息</span>
                  <select value={housingLoan} onChange={e => setHousingLoan(Number(e.target.value))} className="flex-1 border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00b38a] focus:ring-1 focus:ring-[#00b38a] focus:bg-white transition-all text-gray-800">
                    <option value={0}>请选择</option>
                    <option value={1000}>首套住房贷款 (1000元/月)</option>
                  </select>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-600 w-32">住房租金扣除</span>
                  <select value={housingRent} onChange={e => setHousingRent(Number(e.target.value))} className="flex-1 border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00b38a] focus:ring-1 focus:ring-[#00b38a] focus:bg-white transition-all text-gray-800">
                    <option value={0}>请选择</option>
                    <option value={1500}>直辖市、省会等 (1500元/月)</option>
                    <option value={1100}>市辖区户籍超100万 (1100元/月)</option>
                    <option value={800}>市辖区户籍不到100万 (800元/月)</option>
                  </select>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-600 w-32">婴幼儿照护</span>
                  <select value={infantCare} onChange={e => setInfantCare(Number(e.target.value))} className="flex-1 border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00b38a] focus:ring-1 focus:ring-[#00b38a] focus:bg-white transition-all text-gray-800">
                    <option value={0}>请选择</option>
                    <option value={2000}>1个婴幼儿 (2000元/月)</option>
                    <option value={4000}>2个婴幼儿 (4000元/月)</option>
                  </select>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-600 w-32">个人养老金</span>
                  <div className="relative flex-1">
                    <input 
                      type="number" 
                      value={personalPension} 
                      onChange={e => setPersonalPension(e.target.value)}
                      className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00b38a] focus:ring-1 focus:ring-[#00b38a] focus:bg-white transition-all text-gray-800"
                      placeholder="请输入扣除金额"
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  大病医疗扣除需次年纳税人自行扣除，系统暂不支持按月扣除计算
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 计算结果 */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-[#00b38a]" />
            计算结果 
            <span className="text-xs text-gray-400 font-normal ml-2 bg-gray-50 px-2 py-1 rounded">(由于各地工伤保险略有差异，计算结果仅供参考)</span>
          </h2>
          
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm text-left border-collapse">
              <tbody>
                {/* 汇总行 */}
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <td className="py-4 px-5 text-gray-600 w-1/4 font-medium">个人税前总收入</td>
                  <td className="py-4 px-5 text-[#ff6b00] w-1/4 font-semibold text-base">{calc.totalSalary.toFixed(2)}</td>
                  <td className="py-4 px-5 text-gray-600 w-1/4 font-medium border-l border-gray-200">个人缴纳公积金(年)</td>
                  <td className="py-4 px-5 text-[#ff6b00] w-1/4 font-semibold text-base">{calc.totalPersonalPF.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-5 text-gray-600 font-medium">公司缴纳公积金(年)</td>
                  <td className="py-4 px-5 text-[#ff6b00] font-semibold text-base">{calc.totalCompanyPF.toFixed(2)}</td>
                  <td className="py-4 px-5 text-gray-600 font-medium border-l border-gray-200 bg-gray-50/50">个人缴纳社保(年)</td>
                  <td className="py-4 px-5 text-[#ff6b00] font-semibold text-base bg-gray-50/50">{calc.totalPersonalSS.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <td className="py-4 px-5 text-gray-600 font-medium">公司缴纳社保(年)</td>
                  <td className="py-4 px-5 text-[#ff6b00] font-semibold text-base">{calc.totalCompanySS.toFixed(2)}</td>
                  <td className="py-4 px-5 text-gray-600 font-medium border-l border-gray-200">公司花费雇佣成本(年)</td>
                  <td className="py-4 px-5 text-[#ff6b00] font-semibold text-base">{calc.companyCost.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-5 text-gray-600 font-medium">专项扣除免税总额(年)</td>
                  <td className="py-4 px-5 text-[#ff6b00] font-semibold text-base" colSpan={3}>{(specialDeduction * 12).toFixed(2)}</td>
                </tr>
                
                {/* 每月明细 */}
                {calc.results.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-orange-50/30 transition-colors">
                    <td className="py-3.5 px-5 text-gray-600">第 {r.month} 个月个人税后收入</td>
                    <td className="py-3.5 px-5 text-[#ff6b00] font-medium">{r.afterTax.toFixed(2)}</td>
                    <td className="py-3.5 px-5 text-gray-600 border-l border-gray-100">第 {r.month} 个月应扣预缴税</td>
                    <td className="py-3.5 px-5 text-[#ff6b00] font-medium">{r.tax.toFixed(2)}</td>
                  </tr>
                ))}
                
                {/* 最终合计 */}
                <tr className="bg-[#fff8f3]">
                  <td className="py-5 px-5 text-gray-800 font-semibold text-base">个人税后总和</td>
                  <td className="py-5 px-5 text-[#ff6b00] font-bold text-xl">{calc.totalAfterTax.toFixed(2)}</td>
                  <td className="py-5 px-5 text-gray-800 font-semibold text-base border-l border-orange-100">应预缴额总和</td>
                  <td className="py-5 px-5 text-[#ff6b00] font-bold text-xl">{calc.totalTax.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
