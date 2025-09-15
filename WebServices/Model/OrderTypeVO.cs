using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SuperStock.Models
{
    public enum OrderTypeVO
    {
        Buy = 1,
        Sell = 0,
        ShortBuy = 2,
        ShortSell = -1
    }
}
