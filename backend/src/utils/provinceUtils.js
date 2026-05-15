'use strict';

const HN_DISTRICTS = ['hoàn kiếm', 'ba đình', 'đống đa', 'hai bà trưng', 'tây hồ', 'long biên', 'cầu giấy', 'thanh xuân', 'hoàng mai', 'hà đông', 'nam từ liêm', 'bắc từ liêm', 'gia lâm', 'đông anh', 'sóc sơn', 'thanh trì', 'mê linh', 'sơn tây'];
const DN_DISTRICTS = ['hải châu', 'thanh khê', 'sơn trà', 'ngũ hành sơn', 'liên chiểu', 'cẩm lệ', 'hòa vang'];
const CT_DISTRICTS = ['ninh kiều', 'bình thủy', 'cái răng', 'ô môn', 'thốt nốt', 'phong điền', 'cờ đỏ', 'vĩnh thạnh', 'thới lai'];
const BD_DISTRICTS = ['thủ dầu một', 'dĩ an', 'thuận an', 'bến cát', 'tân uyên', 'bàu bàng', 'bắc tân uyên', 'dầu tiếng', 'phú giáo'];
const DONG_NAI_DISTRICTS = ['biên hòa', 'long khánh', 'long thành', 'nhơn trạch', 'trảng bom', 'vĩnh cửu', 'thống nhất', 'cẩm mỹ', 'xuân lộc', 'định quán', 'tân phú'];
const LONG_AN_DISTRICTS = ['đức hòa', 'bến lức', 'cần giuộc', 'cần đước', 'tân an', 'thủ thừa', 'tân trụ', 'châu thành', 'đức huệ'];

function inferProvince(district) {
  if (!district) {
    return 'TP.HCM';
  }

  const d = String(district).toLowerCase().trim();
  if (HN_DISTRICTS.some(n => d.includes(n))) {
    return 'Hà Nội';
  }
  if (DN_DISTRICTS.some(n => d.includes(n))) {
    return 'Đà Nẵng';
  }
  if (CT_DISTRICTS.some(n => d.includes(n))) {
    return 'Cần Thơ';
  }
  if (BD_DISTRICTS.some(n => d.includes(n))) {
    return 'Bình Dương';
  }
  if (DONG_NAI_DISTRICTS.some(n => d.includes(n))) {
    return 'Đồng Nai';
  }
  if (LONG_AN_DISTRICTS.some(n => d.includes(n))) {
    return 'Long An';
  }
  return 'TP.HCM';
}

function normalizeProvince(district, province) {
  const inferred = inferProvince(district);
  if (inferred !== 'TP.HCM') {
    return inferred;
  }
  return province || inferred;
}

module.exports = { inferProvince, normalizeProvince };
